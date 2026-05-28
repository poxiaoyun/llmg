If your coding agent or automation flow runs in the terminal, start with this section. LLMG is an OpenAI-compatible gateway, so most CLIs eventually read the same three values even if the variable names differ: a key, a base URL, and a model name.

## Shared prerequisites

- Create a usable key on [API keys](/keys).
- If your instance enforces balance or quota, confirm it on [Wallet](/wallet).
- Decide which CLI you are wiring first: `codex`, `claude`, or `opencode`.

> Validate the smallest working setup first. Only after that should you move variables into a shell profile, dotfile, or project-level config.

## How the common environment pattern works

- Keep one source-of-truth key such as `LLMG_API_KEY`.
- OpenAI-compatible tools usually read `OPENAI_API_KEY` and `OPENAI_BASE_URL` or a config file that points to them.
- Claude Code reads `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_BASE_URL`.
- Some clients also need a local config file such as `~/.codex/config.toml` or `~/.config/opencode/opencode.jsonc`.

## Choose the guide that matches your CLI

| CLI | Open this page when... |
| --- | --- |
| [Codex CLI](/docs?page=codex-cli) | You use Codex in the terminal or want one config that can also be reused inside VS Code. |
| [Claude Code CLI](/docs?page=claude-code-cli) | Your workflow already depends on Anthropic-compatible Messages calls. |
| [OpenCode CLI](/docs?page=opencode-cli) | You want to add a custom OpenAI-compatible provider through `opencode.jsonc`. |

## Verification checklist

No matter which CLI you choose, keep the rollout sequence small and predictable:

1. Confirm the CLI binary itself runs normally.
2. Confirm the environment variables or config file are really loaded.
3. Send a very short prompt such as `Reply with ok`.
4. Check the LLMG usage or logs page and verify the request reached the gateway.