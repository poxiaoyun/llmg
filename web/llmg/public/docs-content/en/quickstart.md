This page is about one thing only: getting your first successful request through the gateway. For most users, that means creating a key, copying the base URL, and sending a request with a model that is actually available on this instance.

## 1. Create an API key

1. Sign in to the current LLMG instance.
2. Open [API keys](/keys).
3. Create a new key and store it in your password manager or secret manager.
4. If your instance uses balance or quota controls, open [Wallet](/wallet) and confirm you have available credits.

> Do not hand an upstream provider key to your app. Client-side integrations should use a key issued by LLMG itself.

## 2. Copy the base URL

For OpenAI-compatible requests, the gateway entry is your domain plus `/v1`:

```text
https://llmg.oneclaw.me/v1
```

The common local development value is:

```text
http://localhost:3000/v1
```

## 3. Verify connectivity with the smallest request

Use one short `chat/completions` request to confirm that your key, base URL, and network path are all correct.

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

## 4. What a successful response looks like

The payload follows the standard OpenAI-style shape. The most important parts are `choices[0].message.content` and `usage`.

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

> A `401` usually means the key is missing, invalid, or expired. A `404` on `/chat/completions` usually means the base URL is missing `/v1`.

## 5. Find the model names that are actually live

Every LLMG instance can expose a different model set. Use one of these checks before you hardcode a model ID:

| Check | When to use it |
| --- | --- |
| [/pricing](/pricing) | You want the fastest visual check for model names, context, and pricing. |
| `GET /v1/models` | You want the live model list inside a script or deployment workflow. |

```bash
curl https://llmg.oneclaw.me/v1/models \
  -H "Authorization: Bearer YOUR_LLMG_API_KEY"
```

## 6. Next steps

- If your tool runs in the terminal, open [CLI agents / Overview](/docs?page=cli-overview).
- If your workflow lives inside VS Code, open [VS Code extension](/docs?page=vscode-extension).
- If you need exact headers, paths, or field definitions, open [API reference](/docs?page=api-reference).