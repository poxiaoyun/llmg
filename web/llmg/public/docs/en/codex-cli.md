Codex CLI is a good fit for the OpenAI-compatible side of LLMG. The setup has two moving parts: declare an LLMG provider in `~/.codex/config.toml`, then expose the gateway key through an environment variable that Codex can read.

## Prerequisites

- `node` or Homebrew is available in your terminal.
- You have already created an LLMG key.
- You know at least one model ID that is enabled on this instance. Check [/pricing](/pricing) or `GET /v1/models` if needed.

## 1. Install Codex CLI

```bash
npm install -g @openai/codex
# or on macOS:
brew install --cask codex
```

Verify the binary before you continue:

```bash
codex --version
```

## 2. Configure `~/.codex/config.toml`

Common locations are:

- macOS / Linux: `~/.codex/config.toml`
- Windows: `%USERPROFILE%\.codex\config.toml`

If the file does not exist, create it. If it already exists, add or update the LLMG provider block:

```toml
model_provider = "llmg"
model = "gpt-4o-mini"
model_reasoning_effort = "high"

[model_providers.llmg]
name = "LLMG"
base_url = "https://your-llmg-domain.com/v1"
env_key = "LLMG_API_KEY"
```

> `base_url` must include `/v1`. Missing that suffix is the most common reason Codex reaches a `404`.

## 3. Export the API key

### macOS / Linux

```bash
export LLMG_API_KEY="your_api_key"
```

Add the same line to `~/.zshrc`, `~/.bashrc`, or the shell profile you actually use if you want it to persist across new terminals.

### Windows PowerShell

```powershell
$env:LLMG_API_KEY = "your_api_key"
```

To persist it:

```powershell
setx LLMG_API_KEY "your_api_key"
```

## 4. Launch Codex

```bash
codex
```

For a quick smoke test, a one-shot prompt is enough:

```bash
codex "Reply with ok if you can see this through LLMG."
```

## 5. Troubleshooting

### `model not found`

The `model` value in `config.toml` must match a model that this exact instance exposes.

### `401` or `unauthorized`

Confirm `LLMG_API_KEY` is really present in the environment that launches Codex.

### `404`

Recheck that `base_url` ends with `/v1`.