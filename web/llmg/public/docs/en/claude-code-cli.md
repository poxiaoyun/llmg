Claude Code should be routed through the Anthropic-compatible side of LLMG, not the OpenAI-compatible one. The important pieces are `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, and explicitly clearing `ANTHROPIC_API_KEY` so the CLI does not fall back to Anthropic defaults.

## Prerequisites

- Claude Code CLI is installed or ready to install.
- You already have an LLMG key.
- You intend to use a Claude-family model that is enabled on this instance.

## 1. Install Claude Code CLI

### macOS / Linux / WSL

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### Windows PowerShell

```powershell
irm https://claude.ai/install.ps1 | iex
```

You can also install it with npm:

```bash
npm install -g @anthropic-ai/claude-code
```

Then verify the command:

```bash
claude --version
```

## 2. Set the environment variables

### One-shot verification

```bash
ANTHROPIC_BASE_URL="https://your-llmg-domain.com/v1" \
ANTHROPIC_AUTH_TOKEN="your_api_key" \
ANTHROPIC_API_KEY="" \
ANTHROPIC_MODEL="claude-3-5-sonnet" \
claude
```

### Current shell session

```bash
export LLMG_API_KEY="your_api_key"
export ANTHROPIC_BASE_URL="https://your-llmg-domain.com/v1"
export ANTHROPIC_AUTH_TOKEN="$LLMG_API_KEY"
export ANTHROPIC_API_KEY=""
export ANTHROPIC_MODEL="claude-3-5-sonnet"
```

> Leave `ANTHROPIC_API_KEY` explicitly empty. Otherwise Claude Code can prefer it and silently route back to the default Anthropic endpoint.

## 3. Pick the model

Use a Claude-series model that is actually enabled on this instance, for example:

- `claude-3-5-sonnet`
- `claude-3-5-haiku`
- Any other Claude-family model visible on [/pricing](/pricing)

## 4. Verify the request path

```bash
claude "Reply with ok if this request reached LLMG."
```

If you get a normal answer, the CLI can see your environment variables, the Anthropic-compatible gateway path is reachable, and the key is valid.

## 5. Troubleshooting

### Authentication errors

Make sure `ANTHROPIC_AUTH_TOKEN` contains the LLMG key, not an upstream provider key.

### Model errors

Check that `ANTHROPIC_MODEL` names a Claude-family model that this instance actually exposes.

### `404`

Confirm `ANTHROPIC_BASE_URL` points to your LLMG domain and still includes `/v1`.