# CLI agents

如果你的 AI 编码工具跑在终端里，并且通过环境变量或本地配置文件读取 endpoint 和密钥，就从这一组文档开始。LLMG 本身是 OpenAI 兼容网关，所以大部分 CLI 客户端最终都只是在读取不同名字的同一组值。

## Shared prerequisites

- 在当前实例的 [API 密钥页面](/keys) 创建一把可用 key。
- 如果实例启用了余额或额度机制，先在 [钱包页](/wallet) 确认可用额度。
- 明确你要接入的是哪一个 CLI：`codex`、`claude` 还是 `opencode`。

> Tip: 先做一轮最小验证，再决定是否把环境变量写进 shell profile 或项目级配置文件。这样回滚最简单。

## Common environment pattern

不同 CLI 读取的变量名不完全一样，但思路基本一致：

- 先保存一把 LLMG 的原始 key，例如 `LLMG_API_KEY`
- OpenAI 兼容 CLI 一般读取 `OPENAI_API_KEY` 与 `OPENAI_BASE_URL`
- Claude Code 读取 `ANTHROPIC_AUTH_TOKEN` 与 `ANTHROPIC_BASE_URL`
- 少数工具还需要额外的本地配置文件，例如 `~/.codex/config.toml` 或 `~/.config/opencode/opencode.jsonc`

## Choose the right guide

### Codex CLI

如果你在终端里运行 `codex`，或者你后面还想在 VS Code 里复用同一套 Codex 配置，先看 [Codex CLI](/docs?page=codex-cli)。

### Claude Code CLI

如果你使用 Anthropic 的 Claude Code CLI，并且你的工作流本来就依赖 Claude Messages 协议，去看 [Claude Code CLI](/docs?page=claude-code-cli)。

### OpenCode CLI

如果你使用 OpenCode 并且可以通过 provider 配置接入自定义 OpenAI 兼容服务，去看 [OpenCode CLI](/docs?page=opencode-cli)。

## Verification checklist

无论你最终用哪一个 CLI，验证步骤都建议保持一致：

1. 先确认版本命令能正常运行。
2. 确认环境变量或配置文件确实已经生效。
3. 发送一句极短的测试提示，例如“回复 ok”。
4. 回到 LLMG 的用量或日志页面，确认请求已经到达网关。