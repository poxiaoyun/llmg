# OpenAI 兼容接口

LLMG 对外暴露的是统一兼容层。对大多数应用来说，只要把 Base URL 指向 LLMG，再换成平台发放的 API 密钥，就可以沿用现有的 OpenAI 风格客户端和调用逻辑。

## 常见接口路径

下面这些接口在项目中已经有明确路由处理：

| 路径 | 用途 |
| --- | --- |
| `/v1/chat/completions` | 最常见的聊天补全调用入口 |
| `/v1/responses` | OpenAI Responses 风格接口 |
| `/v1/responses/compact` | 更紧凑的 Responses 兼容路径 |
| `/v1/embeddings` | 文本嵌入 |
| `/v1/images/generations` | 图像生成 |
| `/v1/audio/transcriptions` | 音频转写 |
| `/v1/audio/translations` | 音频翻译 |
| `/v1/audio/speech` | 语音合成 |
| `/v1/rerank` | 重排序模型调用 |

## 最常见的客户端接法

### 兼容 OpenAI SDK

```ts
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.LLMG_API_KEY,
  baseURL: 'http://localhost:3000/v1',
})

const response = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: '简要介绍一下当前网关。' }],
})
```

### 兼容 cURL / HTTP Client

```bash
curl http://localhost:3000/v1/responses \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "input": "返回一句状态检查成功。"
  }'
```

## 何时需要查看渠道类型而不是只看接口路径

虽然客户端入口统一，但不同供应商最终可能使用不同的格式和能力：

- Claude Messages 与 OpenAI 兼容请求之间存在格式差异。
- Gemini、Rerank、音频和图像模型的参数支持范围不同。
- 部分格式转换是单向或能力受限的，例如某些 Gemini 反向兼容场景只支持文本。

## 建议的集成方式

1. 先用 `chat/completions` 或 `responses` 打通基础调用。
2. 再根据业务需要逐步扩展到 embeddings、images、audio 或 rerank。
3. 每新增一种接口，都回控制台确认日志、计费和模型映射是否正确。

## 接口集成中的常见问题

### 返回 401 或 403

优先检查 API 密钥是否有效、是否过期，以及是否有模型或分组限制。

### 返回模型不存在

优先检查价格页是否存在该模型，以及渠道中是否配置了模型映射或上游真实模型名。

### 返回格式不兼容

优先确认你当前选择的渠道类型是否支持目标能力，而不是只看客户端路径是否正确。