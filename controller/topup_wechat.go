package controller

import (
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"github.com/wechatpay-apiv3/wechatpay-go/core"
	"github.com/wechatpay-apiv3/wechatpay-go/core/auth/verifiers"
	"github.com/wechatpay-apiv3/wechatpay-go/core/downloader"
	"github.com/wechatpay-apiv3/wechatpay-go/core/notify"
	"github.com/wechatpay-apiv3/wechatpay-go/core/option"
	payments "github.com/wechatpay-apiv3/wechatpay-go/services/payments"
	wechatnative "github.com/wechatpay-apiv3/wechatpay-go/services/payments/native"
)

type WeChatPayRequest struct {
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"payment_method"`
}

type wechatPayRuntime struct {
	client            *core.Client
	notifyHandler     *notify.Handler
	configFingerprint string
}

var (
	wechatPayRuntimeMu sync.Mutex
	wechatPayRuntimeV  *wechatPayRuntime
)

func getWeChatPayMinTopup() int64 {
	minTopup := setting.WeChatPayMinTopUp
	if minTopup < 1 {
		minTopup = 1
	}
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		dMinTopup := decimal.NewFromInt(int64(minTopup))
		dQuotaPerUnit := decimal.NewFromFloat(common.QuotaPerUnit)
		return dMinTopup.Mul(dQuotaPerUnit).IntPart()
	}
	return int64(minTopup)
}

func getWeChatPayNotifyURL() string {
	notifyURL := strings.TrimSpace(setting.WeChatPayNotifyUrl)
	if notifyURL != "" {
		return notifyURL
	}
	callbackAddress := strings.TrimRight(service.GetCallbackAddress(), "/")
	if callbackAddress == "" {
		return ""
	}
	return callbackAddress + "/api/user/wechat/notify"
}

func getWeChatPayReturnURL() string {
	return strings.TrimSpace(setting.WeChatPayReturnUrl)
}

func normalizeTopUpAmountForStorage(amount int64) int64 {
	if operation_setting.GetQuotaDisplayType() != operation_setting.QuotaDisplayTypeTokens {
		return amount
	}
	dAmount := decimal.NewFromInt(amount)
	dQuotaPerUnit := decimal.NewFromFloat(common.QuotaPerUnit)
	return dAmount.Div(dQuotaPerUnit).IntPart()
}

func yuanToFen(amount float64) int64 {
	return decimal.NewFromFloat(amount).Mul(decimal.NewFromInt(100)).Round(0).IntPart()
}

func parseWeChatPayPrivateKey(raw string) (*rsa.PrivateKey, error) {
	normalized := strings.TrimSpace(strings.ReplaceAll(raw, `\n`, "\n"))
	if normalized == "" {
		return nil, errors.New("微信支付商户私钥未配置")
	}

	if block, _ := pem.Decode([]byte(normalized)); block != nil {
		return parseWeChatPayPrivateKeyDER(block.Bytes)
	}

	compact := strings.Map(func(r rune) rune {
		switch r {
		case ' ', '\n', '\r', '\t':
			return -1
		default:
			return r
		}
	}, normalized)
	der, err := base64.StdEncoding.DecodeString(compact)
	if err != nil {
		return nil, fmt.Errorf("解析微信支付商户私钥失败: %w", err)
	}
	return parseWeChatPayPrivateKeyDER(der)
}

func parseWeChatPayPrivateKeyDER(der []byte) (*rsa.PrivateKey, error) {
	pkcs8Key, err := x509.ParsePKCS8PrivateKey(der)
	if err == nil {
		rsaKey, ok := pkcs8Key.(*rsa.PrivateKey)
		if !ok {
			return nil, errors.New("微信支付商户私钥不是 RSA 私钥")
		}
		return rsaKey, nil
	}

	rsaKey, pkcs1Err := x509.ParsePKCS1PrivateKey(der)
	if pkcs1Err == nil {
		return rsaKey, nil
	}

	return nil, fmt.Errorf("解析微信支付商户私钥失败: %w", err)
}

func getWeChatPayRuntime(ctx context.Context) (*wechatPayRuntime, error) {
	configFingerprint := strings.Join([]string{
		strings.TrimSpace(setting.WeChatPayAppID),
		strings.TrimSpace(setting.WeChatPayMerchantID),
		strings.TrimSpace(setting.WeChatPayMerchantCertificateSerialNumber),
		strings.TrimSpace(setting.WeChatPayMerchantPrivateKey),
		strings.TrimSpace(setting.WeChatPayAPIv3Key),
	}, "|")

	wechatPayRuntimeMu.Lock()
	defer wechatPayRuntimeMu.Unlock()

	if wechatPayRuntimeV != nil && wechatPayRuntimeV.configFingerprint == configFingerprint {
		return wechatPayRuntimeV, nil
	}

	privateKey, err := parseWeChatPayPrivateKey(setting.WeChatPayMerchantPrivateKey)
	if err != nil {
		return nil, err
	}

	client, err := core.NewClient(ctx,
		option.WithWechatPayAutoAuthCipher(
			strings.TrimSpace(setting.WeChatPayMerchantID),
			strings.TrimSpace(setting.WeChatPayMerchantCertificateSerialNumber),
			privateKey,
			strings.TrimSpace(setting.WeChatPayAPIv3Key),
		),
	)
	if err != nil {
		return nil, err
	}

	certificateVisitor := downloader.MgrInstance().GetCertificateVisitor(strings.TrimSpace(setting.WeChatPayMerchantID))
	notifyHandler, err := notify.NewRSANotifyHandler(
		strings.TrimSpace(setting.WeChatPayAPIv3Key),
		verifiers.NewSHA256WithRSAVerifier(certificateVisitor),
	)
	if err != nil {
		return nil, err
	}

	wechatPayRuntimeV = &wechatPayRuntime{
		client:            client,
		notifyHandler:     notifyHandler,
		configFingerprint: configFingerprint,
	}
	return wechatPayRuntimeV, nil
}

func RequestWeChatPay(c *gin.Context) {
	var req WeChatPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if req.PaymentMethod != model.PaymentMethodWeChatNative {
		common.ApiErrorMsg(c, "不支持的支付渠道")
		return
	}
	if !isWeChatPayTopUpEnabled() {
		common.ApiErrorMsg(c, "当前管理员未配置微信支付信息")
		return
	}

	minTopup := getWeChatPayMinTopup()
	if req.Amount < minTopup {
		common.ApiErrorMsg(c, fmt.Sprintf("充值数量不能小于 %d", minTopup))
		return
	}

	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		common.ApiErrorMsg(c, "获取用户分组失败")
		return
	}

	payMoney := getPayMoney(req.Amount, group)
	if payMoney < 0.01 {
		common.ApiErrorMsg(c, "充值金额过低")
		return
	}

	notifyURL := getWeChatPayNotifyURL()
	if notifyURL == "" {
		common.ApiErrorMsg(c, "当前管理员未配置微信支付回调地址")
		return
	}

	runtime, err := getWeChatPayRuntime(c.Request.Context())
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 SDK 初始化失败 user_id=%d error=%q", id, err.Error()))
		common.ApiErrorMsg(c, "当前管理员未配置微信支付信息")
		return
	}

	totalFee := yuanToFen(payMoney)
	if totalFee <= 0 {
		common.ApiErrorMsg(c, "充值金额过低")
		return
	}

	tradeNo := fmt.Sprintf("USR%dNO%s%d", id, common.GetRandomString(6), time.Now().Unix())
	expireAt := time.Now().Add(15 * time.Minute)
	svc := wechatnative.NativeApiService{Client: runtime.client}
	resp, result, err := svc.Prepay(c.Request.Context(), wechatnative.PrepayRequest{
		Appid:       core.String(strings.TrimSpace(setting.WeChatPayAppID)),
		Mchid:       core.String(strings.TrimSpace(setting.WeChatPayMerchantID)),
		Description: core.String(fmt.Sprintf("账户充值 %d", req.Amount)),
		OutTradeNo:  core.String(tradeNo),
		NotifyUrl:   core.String(notifyURL),
		TimeExpire:  core.Time(expireAt),
		Amount: &wechatnative.Amount{
			Currency: core.String("CNY"),
			Total:    core.Int64(totalFee),
		},
		SceneInfo: &wechatnative.SceneInfo{
			PayerClientIp: core.String(c.ClientIP()),
		},
	})
	if err != nil {
		statusCode := 0
		if result != nil && result.Response != nil {
			statusCode = result.Response.StatusCode
		}
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 Native 下单失败 user_id=%d trade_no=%s amount=%d money=%.2f status=%d error=%q", id, tradeNo, req.Amount, payMoney, statusCode, err.Error()))
		common.ApiErrorMsg(c, "拉起支付失败")
		return
	}
	if resp == nil || resp.CodeUrl == nil || strings.TrimSpace(*resp.CodeUrl) == "" {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 Native 下单返回缺少 code_url user_id=%d trade_no=%s amount=%d money=%.2f response=%q", id, tradeNo, req.Amount, payMoney, common.GetJsonString(resp)))
		common.ApiErrorMsg(c, "拉起支付失败")
		return
	}

	topUp := &model.TopUp{
		UserId:                 id,
		Amount:                 normalizeTopUpAmountForStorage(req.Amount),
		Money:                  payMoney,
		TradeNo:                tradeNo,
		PaymentMethod:          model.PaymentMethodWeChatNative,
		PaymentProvider:        model.PaymentProviderWeChatPay,
		CreateTime:             time.Now().Unix(),
		Status:                 common.TopUpStatusPending,
		BillingContactSnapshot: model.GetUserBillingContactSnapshot(id),
	}
	if err = topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 创建充值订单失败 user_id=%d trade_no=%s amount=%d money=%.2f error=%q", id, tradeNo, req.Amount, payMoney, err.Error()))
		common.ApiErrorMsg(c, "创建订单失败")
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("微信支付 Native 充值订单创建成功 user_id=%d trade_no=%s amount=%d money=%.2f code_url=%q", id, tradeNo, req.Amount, payMoney, *resp.CodeUrl))
	common.ApiSuccess(c, gin.H{
		"trade_no":   tradeNo,
		"code_url":   *resp.CodeUrl,
		"expires_at": expireAt.Unix(),
		"return_url": getWeChatPayReturnURL(),
	})
}

func WeChatPayNotify(c *gin.Context) {
	ctx := c.Request.Context()
	if !isWeChatPayWebhookEnabled() {
		logger.LogWarn(ctx, fmt.Sprintf("微信支付 webhook 被拒绝 reason=webhook_disabled path=%q client_ip=%s", c.Request.RequestURI, c.ClientIP()))
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	runtime, err := getWeChatPayRuntime(ctx)
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 webhook SDK 初始化失败 path=%q client_ip=%s error=%q", c.Request.RequestURI, c.ClientIP(), err.Error()))
		c.AbortWithStatus(http.StatusServiceUnavailable)
		return
	}

	transaction := new(payments.Transaction)
	notifyReq, err := runtime.notifyHandler.ParseNotifyRequest(ctx, c.Request, transaction)
	if err != nil {
		logger.LogWarn(ctx, fmt.Sprintf("微信支付 webhook 验签或解密失败 path=%q client_ip=%s error=%q", c.Request.RequestURI, c.ClientIP(), err.Error()))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	tradeNo := ""
	if transaction.OutTradeNo != nil {
		tradeNo = strings.TrimSpace(*transaction.OutTradeNo)
	}
	tradeState := ""
	if transaction.TradeState != nil {
		tradeState = strings.TrimSpace(*transaction.TradeState)
	}
	logger.LogInfo(ctx, fmt.Sprintf("微信支付 webhook 收到请求 trade_no=%s trade_state=%s summary=%q client_ip=%s transaction=%q", tradeNo, tradeState, notifyReq.Summary, c.ClientIP(), common.GetJsonString(transaction)))

	if tradeNo == "" {
		logger.LogWarn(ctx, fmt.Sprintf("微信支付 webhook 缺少订单号 client_ip=%s summary=%q", c.ClientIP(), notifyReq.Summary))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	if !strings.EqualFold(tradeState, "SUCCESS") {
		logger.LogInfo(ctx, fmt.Sprintf("微信支付 webhook 忽略非成功状态 trade_no=%s trade_state=%s client_ip=%s", tradeNo, tradeState, c.ClientIP()))
		c.Status(http.StatusOK)
		return
	}

	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	topUp := model.GetTopUpByTradeNo(tradeNo)
	if topUp == nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 回调订单不存在 trade_no=%s client_ip=%s", tradeNo, c.ClientIP()))
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if topUp.PaymentProvider != model.PaymentProviderWeChatPay {
		logger.LogError(ctx, fmt.Sprintf("微信支付 订单支付网关不匹配 trade_no=%s order_provider=%s client_ip=%s", tradeNo, topUp.PaymentProvider, c.ClientIP()))
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if topUp.Status == common.TopUpStatusSuccess {
		c.Status(http.StatusOK)
		return
	}

	expectedTotalFee := yuanToFen(topUp.Money)
	actualTotalFee := int64(0)
	if transaction.Amount != nil && transaction.Amount.Total != nil {
		actualTotalFee = *transaction.Amount.Total
	}
	if actualTotalFee <= 0 || actualTotalFee != expectedTotalFee {
		logger.LogError(ctx, fmt.Sprintf("微信支付 回调金额校验失败 trade_no=%s expected_total=%d actual_total=%d client_ip=%s", tradeNo, expectedTotalFee, actualTotalFee, c.ClientIP()))
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err = model.RechargeWeChatPay(tradeNo, c.ClientIP()); err != nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 充值处理失败 trade_no=%s client_ip=%s error=%q", tradeNo, c.ClientIP(), err.Error()))
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	transactionID := ""
	if transaction.TransactionId != nil {
		transactionID = *transaction.TransactionId
	}
	logger.LogInfo(ctx, fmt.Sprintf("微信支付 充值成功 trade_no=%s transaction_id=%q client_ip=%s", tradeNo, transactionID, c.ClientIP()))
	c.Status(http.StatusOK)
}