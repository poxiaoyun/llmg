package service

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/types"
)

func TestEstimateTokenRateLimitCostIncludesMaxTokens(t *testing.T) {
	meta := &types.TokenCountMeta{MaxTokens: 256}
	if got := estimateTokenRateLimitCost(128, meta); got != 384 {
		t.Fatalf("estimateTokenRateLimitCost() = %d, want 384", got)
	}
}

func TestEstimateTokenRateLimitCostHasMinimumOne(t *testing.T) {
	if got := estimateTokenRateLimitCost(0, nil); got != 1 {
		t.Fatalf("estimateTokenRateLimitCost() = %d, want 1", got)
	}
}

func TestTokenRateWindowLimiterRejectsRPM(t *testing.T) {
	limiter := newTokenRateWindowLimiter()
	now := time.Unix(1_700_000_000, 0)
	window := time.Minute

	if allowed, _ := limiter.allowAt(now, "req", "tok", 2, 0, 10, window); !allowed {
		t.Fatal("first request should be allowed")
	}
	if allowed, _ := limiter.allowAt(now.Add(10*time.Second), "req", "tok", 2, 0, 10, window); !allowed {
		t.Fatal("second request should be allowed")
	}
	if allowed, dimension := limiter.allowAt(now.Add(20*time.Second), "req", "tok", 2, 0, 10, window); allowed || dimension != tokenRateLimitRPM {
		t.Fatalf("third request should be rejected by RPM, got allowed=%v dimension=%v", allowed, dimension)
	}
}

func TestTokenRateWindowLimiterRejectsTPM(t *testing.T) {
	limiter := newTokenRateWindowLimiter()
	now := time.Unix(1_700_000_000, 0)
	window := time.Minute

	if allowed, _ := limiter.allowAt(now, "req", "tok", 0, 100, 60, window); !allowed {
		t.Fatal("first request should be allowed")
	}
	if allowed, dimension := limiter.allowAt(now.Add(5*time.Second), "req", "tok", 0, 100, 50, window); allowed || dimension != tokenRateLimitTPM {
		t.Fatalf("second request should be rejected by TPM, got allowed=%v dimension=%v", allowed, dimension)
	}
}

func TestTokenRateWindowLimiterExpiresWindow(t *testing.T) {
	limiter := newTokenRateWindowLimiter()
	now := time.Unix(1_700_000_000, 0)
	window := time.Minute

	if allowed, _ := limiter.allowAt(now, "req", "tok", 1, 0, 10, window); !allowed {
		t.Fatal("first request should be allowed")
	}
	if allowed, _ := limiter.allowAt(now.Add(61*time.Second), "req", "tok", 1, 0, 10, window); !allowed {
		t.Fatal("request after the window should be allowed again")
	}
}