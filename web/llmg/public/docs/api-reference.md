# API reference

LLMG 对外暴露的是统一网关入口。你可以根据客户端协议选择 OpenAI 兼容、Anthropic Messages 或其他兼容路径，但真正的认证和模型可用性仍然由当前实例中的 key、权限和渠道配置决定。

## 常用端点

| 路径 | 说明 |
| --- | --- |
| `POST /v1/chat/completions` | OpenAI 聊天补全 |
| `POST /v1/responses` | OpenAI Responses |
| `POST /v1/messages` | Anthropic Claude Messages |
| `GET /v1/models` | 列出可用模型 |
| `POST /v1/embeddings` | 嵌入模型 |
| `POST /v1/images/generations` | 图像生成 |
| `POST /v1/audio/transcriptions` | 音频转写 |
| `POST /v1/audio/speech` | 语音合成 |
| `POST /v1/rerank` | Rerank 模型 |

## 鉴权方式

### OpenAI 兼容请求

```text
Authorization: Bearer YOUR_LLMG_API_KEY
```

### Anthropic 兼容请求

```text
x-api-key: YOUR_LLMG_API_KEY
anthropic-version: 2023-06-01
```

### Gemini 风格列表请求

项目也支持 Gemini 风格的模型列表路径。常见写法是通过 `x-goog-api-key` 或 `?key=` 传入同一把 LLMG key。

## OpenAI `chat/completions` 最小请求体

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `model` | 是 | 当前实例启用的模型 ID |
| `messages` | 是 | 至少一条消息 |
| `temperature` | 否 | 采样温度 |
| `max_tokens` | 否 | 最大输出 token 数 |
| `stream` | 否 | 是否开启 SSE 流式输出 |
| `tools` / `tool_choice` | 否 | 与 OpenAI 风格一致的工具调用定义 |

## `chat/completions` 示例

```bash
curl https://your-llmg-domain.com/v1/chat/completions \
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
curl https://your-llmg-domain.com/v1/messages \
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

### OpenAI 兼容响应

非流式返回会保持 OpenAI 风格，重点看：

- `choices[0].message.content`：模型输出
- `finish_reason`：停止原因
- `usage`：计费与用量统计

### 流式响应

当 `stream=true` 时，返回为 Server-Sent Events。对于大多数 OpenAI SDK，不需要额外改协议，只要 SDK 本身支持流式读取即可。

## 模型发现

程序化发现模型时，优先使用：

```bash
curl https://your-llmg-domain.com/v1/models \
  -H "Authorization: Bearer YOUR_LLMG_API_KEY"
```

如果你只想从界面里查价格、上下文和能力标签，直接打开 `/pricing` 会更直观。

## 常见接入问题

### 401

通常表示 key 不正确、权限不足或头部没带上。

### 404

最常见原因是 URL 不完整，尤其是漏了 `/v1`。

### 422 或请求体错误

优先确认你当前用的是哪一种兼容协议，不要把 OpenAI 风格请求体直接发到 Claude Messages 路径，反之亦然。