OpenCode can connect to LLMG through a custom provider block. Unlike some other CLIs, the critical configuration usually lives in `opencode.jsonc` rather than only in your shell profile.

## Prerequisites

- Node.js 20+ or another supported OpenCode installation path is available.
- You already created an LLMG key.
- You know at least one model that is enabled on this instance.

## 1. Install OpenCode

```bash
curl -fsSL https://opencode.ai/install | bash
```

Or install with npm:

```bash
npm install -g opencode-ai
```

Verify the binary:

```bash
opencode --version
```

## 2. Optional environment variables

If you prefer keeping the key in your shell, export the usual OpenAI-compatible variables first:

```bash
export OPENAI_API_KEY="your_api_key"
export OPENAI_BASE_URL="https://llmg.oneclaw.me/v1"
```

## 3. Create `opencode.jsonc`

Common locations are:

- macOS / Linux: `~/.config/opencode/opencode.jsonc`
- Windows: `%USERPROFILE%\.config\opencode\opencode.jsonc`

Create the directory and file if they do not exist yet.

## 4. Add an LLMG provider block

Replace the model list with the models your own instance exposes:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "llmg": {
      "name": "LLMG",
      "npm": "@ai-sdk/openai-compatible",
      "models": {
        "gpt-4o-mini": {
          "name": "LLMG gpt-4o-mini"
        },
        "claude-3-5-sonnet": {
          "name": "LLMG claude-3-5-sonnet"
        }
      },
      "options": {
        "baseURL": "https://llmg.oneclaw.me/v1",
        "apiKey": "your_api_key"
      }
    }
  }
}
```

> The model names in the example are placeholders. Replace them with the real names you see on [/pricing](/pricing) or in `GET /v1/models`.

## 5. Launch and select the model

```bash
opencode
```

Inside the client, use `/model` or the equivalent selector to switch to the LLMG-backed provider you just added.

## 6. Troubleshooting

### The provider does not appear

Check that `opencode.jsonc` is stored in the path OpenCode actually loads.

### The model cannot be selected

The model names in the file do not match the models this instance exposes.

### Requests fail immediately

Recheck the `baseURL` and make sure it is the full gateway URL ending in `/v1`.