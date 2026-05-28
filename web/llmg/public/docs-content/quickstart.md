# Quickstart

本页只关心一件事：让你尽快跑通第一次调用。对大多数用户来说，只需要准备好 API key、base URL，然后用一个真实可用的模型发出请求。

## 获取 API key

1. 先登录到当前实例。
2. 打开 [API 密钥页面](/keys)。
3. 创建一把新 key，并把它保存到密码管理器或服务端密钥管理里。
4. 如果你的实例需要余额或额度支持，顺手去 [钱包页](/wallet) 确认可用余额。

> 提示：不要把上游供应商的 key 直接发给应用。应用侧应该只使用 LLMG 发放的 key。

## Base URL

OpenAI 兼容调用统一使用“你的网关域名 + `/v1`”这一个入口：

```text
https://llmg.oneclaw.me/v1
```

本地开发默认常见写法：

```text
http://localhost:3000/v1
```

## 验证连接

先用最短的 `chat/completions` 请求确认三件事同时正确：key、base URL、网络连通性。

### curl

```bash
curl https://llmg.oneclaw.me/v1/chat/completions \
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
    base_url="https://llmg.oneclaw.me/v1",
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
  baseURL: 'https://llmg.oneclaw.me/v1',
})

const response = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hello' }],
})

console.log(response.choices[0]?.message?.content)
```

### 成功响应长什么样

成功时你会拿到一份标准 OpenAI 风格 JSON，最关键的是：

- `choices[0].message.content` 里有模型回复
- `usage` 里有 token 统计

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

> Tip: 401 通常表示 key 缺失、错误或失效。对 `/chat/completions` 返回 404 时，首先检查 base URL 是否漏掉了 `/v1`。

## 查找可用模型

不同实例的可用模型并不相同。你可以用两种方式确认：

### 价格页

打开 [/pricing](/pricing)，直接查看模型名称、上下文、价格和能力标签。

### 程序化列出模型

```bash
curl https://llmg.oneclaw.me/v1/models \
  -H "Authorization: Bearer YOUR_LLMG_API_KEY"
```

## 支持的工具类型

只要工具允许你自定义 OpenAI 兼容 endpoint，通常都可以接入：

- 服务端 OpenAI SDK
- 自定义 HTTP 客户端
- 允许填写 Base URL 和 API key 的桌面应用
- 支持 OpenAI 兼容模型入口的代理、工作流或自动化工具

如果你的客户端走 Claude Messages 协议，请继续看 [Anthropic / Claude 客户端](/docs?page=anthropic-clients)。

## 下一步

- 如果你要在终端里接代理或编码工具，继续看 [CLI agents / Overview](/docs?page=cli-overview)
- 如果你要在 VS Code 里使用扩展，继续看 [VS Code extension](/docs?page=vscode-extension)
- 如果你要对照接口字段，继续看 [API reference](/docs?page=api-reference)