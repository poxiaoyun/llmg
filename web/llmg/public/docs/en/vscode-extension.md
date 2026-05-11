If you drive coding workflows from a VS Code extension, you can usually reuse the same Codex-style configuration that already works in the terminal. In practice, the extension setup is mostly about making sure VS Code can see the same environment variables and `~/.codex/config.toml` values that Codex CLI uses.

## Prerequisites

- VS Code is installed.
- You use an OpenAI or Codex extension that reads the Codex configuration flow.
- You already created an LLMG key.
- Ideally you already finished [Codex CLI](/docs?page=codex-cli).

## Export the key

### macOS / Linux

```bash
export LLMG_API_KEY="your_api_key"
```

If you stored it in `~/.zshrc` or `~/.bashrc`, reload the shell before launching VS Code:

```bash
source ~/.zshrc
# or
source ~/.bashrc
```

### Windows PowerShell

```powershell
$env:LLMG_API_KEY = "your_api_key"
```

To keep it across sessions:

```powershell
setx LLMG_API_KEY "your_api_key"
```

## Make sure Codex config points to LLMG

If you have not configured it yet, add an LLMG provider to `~/.codex/config.toml`:

```toml
model_provider = "llmg"
model = "gpt-4o-mini"

[model_providers.llmg]
name = "LLMG"
base_url = "https://your-llmg-domain.com/v1"
env_key = "LLMG_API_KEY"
```

> When an extension reuses Codex settings, the most common problem is not the extension itself. It is that VS Code was launched before the environment variable existed.

## Launch VS Code from a prepared terminal

The most reliable path is to start VS Code from a terminal that already has `LLMG_API_KEY` loaded:

```bash
cd your-project
code .
```

## Verify the request path

Open the extension panel and send a short prompt such as:

```text
Reply with 'ok' if you can see this.
```

Then return to the LLMG console and confirm the request shows up in usage or logs.

## Troubleshooting

### The extension still returns `401`

VS Code probably was not launched from a shell that had the new variable exported.

### The model is unavailable

The `model` in `config.toml` must be a model this instance really exposes.

### The new settings do not apply

Restart VS Code and the extension host, then send the prompt again.