# OpenAI 兼容客户端

如果你的 SDK、服务或桌面工具支持自定义 OpenAI endpoint，通常只需要改三个值就能接入 LLMG：

- **Base URL**：你的网关地址，加上 `/v1`
- **API Key**：在 LLMG 中创建的 key
- **Model**：当前实例里实际启用的模型 ID

## 必填配置项

### Base URL

生产环境通常写成：

```text
https://llmg.oneclaw.me/v1
```

本地开发默认可以是：

```text
http://localhost:3000/v1
```

### API Key

使用 LLMG 控制台发放的 key，不要直接把上游供应商的 key 填给客户端。

### Model ID

模型名不是固定常量，它取决于实例启用了哪些渠道和模型映射。接入前先到 `/pricing` 或 `/v1/models` 看清楚你当前能调什么。

## JavaScript / TypeScript

```ts
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.LLMG_API_KEY,
  baseURL: 'https://llmg.oneclaw.me/v1',
})

const completion = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: '返回一句连接测试成功。' }],
})

console.log(completion.choices[0]?.message?.content)
```

## Python

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_LLMG_API_KEY",
    base_url="https://llmg.oneclaw.me/v1",
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "返回一句连接测试成功。"}],
)

print(response.choices[0].message.content)
```

## 直接 HTTP / cURL

```bash
curl https://llmg.oneclaw.me/v1/chat/completions \
  -H "Authorization: Bearer YOUR_LLMG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## 在桌面工具或第三方应用里怎么填

凡是支持“OpenAI 兼容接口”或“自定义 OpenAI Base URL”的工具，通常都可以按下面的映射填写：

| 应用字段 | 填写内容 |
| --- | --- |
| Base URL / Endpoint | `https://llmg.oneclaw.me/v1` |
| API Key | LLMG 中创建的 key |
| Model | 当前实例实际可用的模型 ID |

## 常见错误

### 返回 401

通常表示 key 缺失、过期、被禁用，或者没有放在 `Authorization: Bearer ...` 里。

### 返回 404

最常见原因是 Base URL 漏掉了 `/v1` 后缀。

### 返回模型不存在

说明该模型没有在你的实例中启用，或者当前 key 没有权限访问它。请先查看 `/pricing` 或 `/v1/models`。

## 接下来读什么

- 如果你还没跑通第一条请求，回到 [快速开始](/docs?page=quickstart)
- 如果你要对照字段与响应结构，继续看 [API reference](/docs?page=api-reference)
- 如果你要先确认模型和价格，直接看 [模型与价格](/docs?page=model-catalog)