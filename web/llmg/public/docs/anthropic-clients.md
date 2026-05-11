# Anthropic / Claude 客户端

LLMG 同时支持 Claude Messages 风格的调用入口。如果你的工具或 SDK 默认走 Anthropic 协议，可以把它接到同一个网关上，而不需要再暴露一套独立的上游凭据。

## 入口地址

Claude Messages 的常用入口是：

```text
https://your-llmg-domain.com/v1/messages
```

## 必要请求头

Anthropic 兼容调用至少需要这两个头：

```text
x-api-key: YOUR_LLMG_API_KEY
anthropic-version: 2023-06-01
```

和 OpenAI 兼容调用不同，这里通常不使用 `Authorization: Bearer ...` 作为主鉴权头。

## cURL 验证请求

```bash
curl https://your-llmg-domain.com/v1/messages \
  -H "x-api-key: YOUR_LLMG_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet",
    "max_tokens": 256,
    "messages": [
      {"role": "user", "content": "请返回一句简短的连接成功提示。"}
    ]
  }'
```

## 使用 Anthropic 兼容客户端时要确认什么

- 客户端是否允许修改 base URL。
- 是否支持自定义请求头，至少要能设置 `x-api-key` 和 `anthropic-version`。
- 模型名是否是你当前实例里真实可用的 Claude 系列模型。

## 如何列出可用模型

如果你想用 Anthropic 风格检查模型列表，可以继续请求 `/v1/models`，同时携带 Anthropic 头：

```bash
curl https://your-llmg-domain.com/v1/models \
  -H "x-api-key: YOUR_LLMG_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

## 什么时候用这个入口，什么时候用 OpenAI 兼容入口

### 继续用 Anthropic 入口

适合你的现有客户端、代理层或工具已经稳定使用 Claude Messages 协议时。

### 切到 OpenAI 兼容入口

如果你的生态里更多是 OpenAI SDK、聊天客户端或统一 API 层，通常还是 `/v1/chat/completions` 更通用。

## 常见错误

### 忘记传 `anthropic-version`

很多看似“认证失败”或“请求体不识别”的问题，根因都是客户端没有带这个头。

### 模型名填成 OpenAI 风格模型

Claude 客户端页面里应该优先使用当前实例允许的 Claude 模型，而不是随便套一个别的供应商模型名。

## 接下来读什么

- 想看所有常用路径和字段，继续看 [API reference](/docs?page=api-reference)
- 想知道当前实例都开了哪些模型，去看 [模型与价格](/docs?page=model-catalog)