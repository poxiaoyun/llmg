LLMG exposes one gateway surface, but you can approach it through different compatible protocols. Authentication, permissions, and model availability still come from the current instance configuration, not from the client library you happen to use.

## Common endpoints

| Path | Purpose |
| --- | --- |
| `POST /v1/chat/completions` | OpenAI chat completions |
| `POST /v1/responses` | OpenAI Responses |
| `POST /v1/messages` | Anthropic Claude Messages |
| `GET /v1/models` | List the models available on this instance |
| `POST /v1/embeddings` | Embeddings |
| `POST /v1/images/generations` | Image generation |
| `POST /v1/audio/transcriptions` | Audio transcription |
| `POST /v1/audio/speech` | Text-to-speech |
| `POST /v1/rerank` | Rerank requests |

## Authentication headers

### OpenAI-compatible calls

```text
Authorization: Bearer YOUR_LLMG_API_KEY
```

### Anthropic-compatible calls

```text
x-api-key: YOUR_LLMG_API_KEY
anthropic-version: 2023-06-01
```

### Gemini-style model listing

This project also supports Gemini-style model list requests. Those usually pass the same LLMG key through `x-goog-api-key` or the `?key=` query parameter.

## Minimal `chat/completions` body

| Field | Required | Notes |
| --- | --- | --- |
| `model` | Yes | A model ID that is enabled on this instance |
| `messages` | Yes | At least one message |
| `temperature` | No | Sampling temperature |
| `max_tokens` | No | Output limit |
| `stream` | No | Enables SSE streaming |
| `tools` / `tool_choice` | No | Standard OpenAI-style tool calling fields |

## `chat/completions` example

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

## `messages` example

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

## Response shapes

- Non-streaming OpenAI-compatible calls return the standard structure with `choices`, `finish_reason`, and `usage`.
- Streaming OpenAI-compatible calls return Server-Sent Events when `stream=true`.
- Anthropic-compatible calls follow the Messages-style response body for the chosen model family.

## Model discovery

Use this call to fetch the live model catalog in code:

```bash
curl https://your-llmg-domain.com/v1/models \
  -H "Authorization: Bearer YOUR_LLMG_API_KEY"
```

If you want a visual check for pricing, context length, and capability tags, open [/pricing](/pricing).

## Common integration failures

### `401`

The key is missing, invalid, lacks permission, or the header is not present.

### `404`

The URL is incomplete. The most common cause is forgetting `/v1`.

### `422` or request validation errors

Confirm that you are sending the right body to the right compatible path. Do not send an OpenAI-style body to `/v1/messages`, and do not send an Anthropic Messages body to `/v1/chat/completions`.