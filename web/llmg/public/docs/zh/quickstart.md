这一页只解决一件事：尽快跑通第一次调用。对大多数用户来说，只要准备好 key、base URL，再用一个当前实例真实可用的模型发出请求，就足够完成首轮验证。

## 1. 获取 API key

1. 登录当前 LLMG 实例。
2. 打开 [API 密钥页面](/keys)。
3. 创建一把新 key，并把它保存到密码管理器或密钥管理系统里。
4. 如果实例启用了余额或额度机制，顺手到 [钱包页](/wallet) 确认可用额度。

> 不要把上游供应商的 key 直接交给应用。客户端应该只使用 LLMG 发放的 key。

## 2. 复制 base URL

OpenAI 兼容调用统一走“你的网关域名 + `/v1`”这个入口：

```text
https://your-llmg-domain.com/v1
```

本地开发常见默认值：

```text
http://localhost:3000/v1
```

## 3. 用最小请求验证连通性

先发一条最短的 `chat/completions` 请求，同时确认 key、base URL 和网络都没问题。

### curl

```bash
curl https://your-llmg-domain.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_LLMG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Python

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_LLMG_API_KEY",
    base_url="https://your-llmg-domain.com/v1",
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello"}],
)

print(response.choices[0].message.content)
```

### JavaScript

```ts
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.LLMG_API_KEY,
  baseURL: 'https://your-llmg-domain.com/v1',
})

const response = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hello' }],
})

console.log(response.choices[0]?.message?.content)
```

## 4. 成功响应长什么样

成功时会返回标准 OpenAI 风格 JSON，最关键的是 `choices[0].message.content` 和 `usage`。

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 11,
    "total_tokens": 20
  }
}
```

> `401` 通常表示 key 缺失、错误或失效；`404` 最常见的原因是 base URL 漏了 `/v1`。

## 5. 查找当前实例真的可用的模型

每个 LLMG 实例能开放的模型都可能不同，建议只用下面两种方式确认：

| 检查方式 | 适合什么时候 |
| --- | --- |
| [/pricing](/pricing) | 想直接看模型名、价格、上下文和能力标签 |
| `GET /v1/models` | 想在脚本、部署或程序里读取实时模型列表 |

```bash
curl https://your-llmg-domain.com/v1/models \
  -H "Authorization: Bearer YOUR_LLMG_API_KEY"
```

## 6. 下一步

- 如果你的工具运行在终端里，继续看 [CLI agents / Overview](/docs?page=cli-overview)。
- 如果你的工作流在 VS Code 里，继续看 [VS Code extension](/docs?page=vscode-extension)。
- 如果你需要精确的协议字段和路径，继续看 [API reference](/docs?page=api-reference)。