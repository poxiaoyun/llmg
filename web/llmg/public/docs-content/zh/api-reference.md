LLMG 对外暴露的是统一网关入口，但你可以用不同的兼容协议来访问它。无论客户端使用哪一种 SDK，真正决定认证、权限和模型可用性的，仍然是当前实例本身的配置。

## 常用端点

| 路径 | 说明 |
| --- | --- |
| `POST /v1/chat/completions` | OpenAI 聊天补全 |
| `POST /v1/responses` | OpenAI Responses |
| `POST /v1/messages` | Anthropic Claude Messages |
| `GET /v1/models` | 列出当前实例可用模型 |
| `POST /v1/embeddings` | 嵌入模型 |
| `POST /v1/images/generations` | 图像生成 |
| `POST /v1/audio/transcriptions` | 音频转写 |
| `POST /v1/audio/speech` | 语音合成 |
| `POST /v1/rerank` | Rerank 请求 |

## 鉴权头部

### OpenAI 兼容请求

```text
Authorization: Bearer YOUR_LLMG_API_KEY
```

### Anthropic 兼容请求

```text
x-api-key: YOUR_LLMG_API_KEY
anthropic-version: 2023-06-01
```

### Gemini 风格模型列表

项目也支持 Gemini 风格的模型列表请求。常见做法是通过 `x-goog-api-key` 或 `?key=` 传同一把 LLMG key。

## 最小 `chat/completions` 请求体

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `model` | 是 | 当前实例启用的模型 ID |
| `messages` | 是 | 至少一条消息 |
| `temperature` | 否 | 采样温度 |
| `max_tokens` | 否 | 最大输出 token |
| `stream` | 否 | 是否开启 SSE 流式返回 |
| `tools` / `tool_choice` | 否 | 标准 OpenAI 风格工具调用字段 |

## `chat/completions` 示例

```bash
curl https://llmg.oneclaw.me/v1/chat/completions \
  -H "Authorization: Bearer YOUR_LLMG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

## `messages` 示例

```bash
curl https://llmg.oneclaw.me/v1/messages \
  -H "x-api-key: YOUR_LLMG_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet",
    "max_tokens": 256,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## 响应格式

- 非流式 OpenAI 兼容调用会返回标准结构，重点字段是 `choices`、`finish_reason` 和 `usage`。
- 当 `stream=true` 时，OpenAI 兼容调用会返回 Server-Sent Events。
- Anthropic 兼容调用会返回对应 Messages 协议的响应体。

## 模型发现

如果你想在程序里读取实时模型列表，优先使用：

```bash
curl https://llmg.oneclaw.me/v1/models \
  -H "Authorization: Bearer YOUR_LLMG_API_KEY"
```

如果你只是想快速看价格、上下文和能力标签，直接打开 [/pricing](/pricing) 会更直观。

## 常见接入问题

### `401`

通常表示 key 缺失、错误、权限不足，或者请求头根本没带上。

### `404`

最常见的原因是 URL 不完整，尤其是漏了 `/v1`。

### `422` 或请求体校验错误

优先确认你当前使用的是哪一种兼容协议。不要把 OpenAI 风格请求体直接发到 `/v1/messages`，反过来也一样。