package service

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/types"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
)

const tokenRateLimitWindow = time.Minute

const tokenDualRateLimitScript = `
local now_ms = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local rpm_limit = tonumber(ARGV[3])
local tpm_limit = tonumber(ARGV[4])
local token_cost = tonumber(ARGV[5])
local member_base = ARGV[6]

local function cleanup(zkey, total_key)
    local expired_before = now_ms - window_ms
    local expired = redis.call('ZRANGEBYSCORE', zkey, '-inf', expired_before)
    local removed = 0
    if #expired > 0 then
        for _, member in ipairs(expired) do
            local sep = string.find(member, '|')
            if sep then
                local weight = tonumber(string.sub(member, sep + 1)) or 0
                removed = removed + weight
            end
        end
        redis.call('ZREMRANGEBYSCORE', zkey, '-inf', expired_before)
    end

    local current = tonumber(redis.call('GET', total_key) or '0')
    current = current - removed
    if current < 0 then
        current = 0
    end

    if current > 0 then
        redis.call('SET', total_key, current, 'PX', window_ms * 2)
    else
        redis.call('DEL', total_key)
    end

    if redis.call('ZCARD', zkey) > 0 then
        redis.call('PEXPIRE', zkey, window_ms * 2)
    else
        redis.call('DEL', zkey)
    end

    return current
end

local req_current = cleanup(KEYS[1], KEYS[2])
local tok_current = cleanup(KEYS[3], KEYS[4])

if rpm_limit > 0 and req_current + 1 > rpm_limit then
    return {0, 1}
end

if tpm_limit > 0 and tok_current + token_cost > tpm_limit then
    return {0, 2}
end

if rpm_limit > 0 then
    redis.call('ZADD', KEYS[1], now_ms, member_base .. '|1')
    redis.call('SET', KEYS[2], req_current + 1, 'PX', window_ms * 2)
    redis.call('PEXPIRE', KEYS[1], window_ms * 2)
end

if tpm_limit > 0 then
    redis.call('ZADD', KEYS[3], now_ms, member_base .. '|' .. token_cost)
    redis.call('SET', KEYS[4], tok_current + token_cost, 'PX', window_ms * 2)
    redis.call('PEXPIRE', KEYS[3], window_ms * 2)
end

return {1, 0}
`

type tokenRateLimitDimension int

const (
	tokenRateLimitNone tokenRateLimitDimension = iota
	tokenRateLimitRPM
	tokenRateLimitTPM
)

type tokenRateLimitEvent struct {
	At     time.Time
	Weight int
}

type tokenRateWindowLimiter struct {
	mu     sync.Mutex
	events map[string][]tokenRateLimitEvent
	totals map[string]int
}

func newTokenRateWindowLimiter() *tokenRateWindowLimiter {
	return &tokenRateWindowLimiter{
		events: make(map[string][]tokenRateLimitEvent),
		totals: make(map[string]int),
	}
}

func (l *tokenRateWindowLimiter) cleanup(key string, now time.Time, window time.Duration) int {
	events := l.events[key]
	if len(events) == 0 {
		delete(l.events, key)
		delete(l.totals, key)
		return 0
	}

	cutoff := now.Add(-window)
	idx := 0
	removed := 0
	for idx < len(events) && !events[idx].At.After(cutoff) {
		removed += events[idx].Weight
		idx++
	}
	if idx > 0 {
		events = append([]tokenRateLimitEvent(nil), events[idx:]...)
		l.events[key] = events
		l.totals[key] -= removed
	}
	if len(events) == 0 {
		delete(l.events, key)
		delete(l.totals, key)
		return 0
	}
	if l.totals[key] < 0 {
		l.totals[key] = 0
	}
	return l.totals[key]
}

func (l *tokenRateWindowLimiter) allowAt(now time.Time, reqKey, tokKey string, rpmLimit, tpmLimit, tokenCost int, window time.Duration) (bool, tokenRateLimitDimension) {
	l.mu.Lock()
	defer l.mu.Unlock()

	requestTotal := l.cleanup(reqKey, now, window)
	tokenTotal := l.cleanup(tokKey, now, window)

	if rpmLimit > 0 && requestTotal+1 > rpmLimit {
		return false, tokenRateLimitRPM
	}
	if tpmLimit > 0 && tokenTotal+tokenCost > tpmLimit {
		return false, tokenRateLimitTPM
	}

	if rpmLimit > 0 {
		l.events[reqKey] = append(l.events[reqKey], tokenRateLimitEvent{At: now, Weight: 1})
		l.totals[reqKey] = requestTotal + 1
	}
	if tpmLimit > 0 {
		l.events[tokKey] = append(l.events[tokKey], tokenRateLimitEvent{At: now, Weight: tokenCost})
		l.totals[tokKey] = tokenTotal + tokenCost
	}

	return true, tokenRateLimitNone
}

func (l *tokenRateWindowLimiter) allow(reqKey, tokKey string, rpmLimit, tpmLimit, tokenCost int, window time.Duration) (bool, tokenRateLimitDimension) {
	return l.allowAt(time.Now(), reqKey, tokKey, rpmLimit, tpmLimit, tokenCost, window)
}

var inMemoryTokenRateWindowLimiter = newTokenRateWindowLimiter()

func EnforceTokenRateLimit(c *gin.Context, promptTokens int, meta *types.TokenCountMeta) *types.NewAPIError {
	tokenID := common.GetContextKeyInt(c, constant.ContextKeyTokenId)
	if tokenID == 0 {
		return nil
	}

	rpmLimit := common.GetContextKeyInt(c, constant.ContextKeyTokenRPMLimit)
	tpmLimit := common.GetContextKeyInt(c, constant.ContextKeyTokenTPMLimit)
	if rpmLimit <= 0 && tpmLimit <= 0 {
		return nil
	}

	tokenCost := estimateTokenRateLimitCost(promptTokens, meta)
	requestID := c.GetString(common.RequestIdKey)
	if requestID == "" {
		requestID = common.GetTimeString() + common.GetRandomString(8)
	}

	allowed, dimension, err := allowTokenRateLimit(context.Background(), tokenID, requestID, rpmLimit, tpmLimit, tokenCost, tokenRateLimitWindow)
	if err != nil {
		return types.NewErrorWithStatusCode(err, types.ErrorCodeRateLimitReached, http.StatusInternalServerError, types.ErrOptionWithSkipRetry())
	}
	if allowed {
		return nil
	}

	minutes := int(tokenRateLimitWindow / time.Minute)
	var message string
	switch dimension {
	case tokenRateLimitTPM:
		message = common.TranslateMessage(c, i18n.MsgRateLimitTokensReached, map[string]any{"Max": tpmLimit, "Minutes": minutes})
	default:
		message = common.TranslateMessage(c, i18n.MsgRateLimitReached, map[string]any{"Max": rpmLimit, "Minutes": minutes})
	}

	return types.NewErrorWithStatusCode(errors.New(message), types.ErrorCodeRateLimitReached, http.StatusTooManyRequests, types.ErrOptionWithSkipRetry())
}

func estimateTokenRateLimitCost(promptTokens int, meta *types.TokenCountMeta) int {
	tokenCost := promptTokens
	if meta != nil && meta.MaxTokens > 0 {
		tokenCost += meta.MaxTokens
	}
	if tokenCost <= 0 {
		return 1
	}
	return tokenCost
}

func allowTokenRateLimit(ctx context.Context, tokenID int, requestID string, rpmLimit, tpmLimit, tokenCost int, window time.Duration) (bool, tokenRateLimitDimension, error) {
	reqKey := fmt.Sprintf("token_rate_limit:%d:req", tokenID)
	tokKey := fmt.Sprintf("token_rate_limit:%d:tok", tokenID)
	if common.RedisEnabled && common.RDB != nil {
		return allowTokenRateLimitRedis(ctx, common.RDB, reqKey, tokKey, requestID, rpmLimit, tpmLimit, tokenCost, window)
	}
	allowed, dimension := inMemoryTokenRateWindowLimiter.allow(reqKey, tokKey, rpmLimit, tpmLimit, tokenCost, window)
	return allowed, dimension, nil
}

func allowTokenRateLimitRedis(ctx context.Context, rdb *redis.Client, reqKey, tokKey, requestID string, rpmLimit, tpmLimit, tokenCost int, window time.Duration) (bool, tokenRateLimitDimension, error) {
	nowMs := time.Now().UnixMilli()
	windowMs := window.Milliseconds()
	keys := []string{reqKey, reqKey + ":total", tokKey, tokKey + ":total"}
	args := []any{nowMs, windowMs, rpmLimit, tpmLimit, tokenCost, fmt.Sprintf("%s:%d", requestID, nowMs)}
	result, err := rdb.Eval(ctx, tokenDualRateLimitScript, keys, args...).Result()
	if err != nil {
		return false, tokenRateLimitNone, err
	}
	values, ok := result.([]interface{})
	if !ok || len(values) < 2 {
		return false, tokenRateLimitNone, fmt.Errorf("unexpected token rate limit result: %T", result)
	}
	allowedFlag, err := toInt64(values[0])
	if err != nil {
		return false, tokenRateLimitNone, err
	}
	dimensionFlag, err := toInt64(values[1])
	if err != nil {
		return false, tokenRateLimitNone, err
	}
	return allowedFlag == 1, tokenRateLimitDimension(dimensionFlag), nil
}

func toInt64(v any) (int64, error) {
	switch value := v.(type) {
	case int64:
		return value, nil
	case int:
		return int64(value), nil
	case uint64:
		return int64(value), nil
	case string:
		return 0, fmt.Errorf("unexpected string result: %s", value)
	default:
		return 0, fmt.Errorf("unexpected result type: %T", v)
	}
}