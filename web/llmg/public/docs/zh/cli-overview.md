如果你的 AI 编码工具运行在终端里，就从这一组文档开始。LLMG 本身是 OpenAI 兼容网关，所以大多数 CLI 最终都只是以不同名字读取同一组核心值：key、base URL 和 model。

## Shared prerequisites

- 在 [API 密钥页面](/keys) 创建一把可用 key。
- 如果实例启用了余额或额度机制，先到 [钱包页](/wallet) 确认可用额度。
- 先决定你要接入的是哪一个 CLI：`codex`、`claude` 还是 `opencode`。

> 先把最小可用链路验证通，再决定是否把变量固化到 shell profile、dotfile 或项目级配置里，这样回滚最简单。

## 通用环境变量思路

- 先保留一把源 key，例如 `LLMG_API_KEY`。
- OpenAI 兼容工具通常会读取 `OPENAI_API_KEY`、`OPENAI_BASE_URL` 或对应的本地配置文件。
- Claude Code 会读取 `ANTHROPIC_AUTH_TOKEN` 和 `ANTHROPIC_BASE_URL`。
- 有些工具还需要本地配置文件，例如 `~/.codex/config.toml` 或 `~/.config/opencode/opencode.jsonc`。

## 按你使用的 CLI 选文档

| CLI | 什么时候打开这篇 |
| --- | --- |
| [Codex CLI](/docs?page=codex-cli) | 你在终端里直接使用 Codex，或者想把同一套配置复用到 VS Code。 |
| [Claude Code CLI](/docs?page=claude-code-cli) | 你的工作流本来就依赖 Anthropic 兼容的 Messages 请求。 |
| [OpenCode CLI](/docs?page=opencode-cli) | 你打算通过 `opencode.jsonc` 添加一个自定义 OpenAI 兼容 provider。 |

## 推荐验证顺序

1. 先确认 CLI 二进制本身能正常运行。
2. 再确认环境变量或配置文件确实已经被加载。
3. 发送一句极短的提示词，例如 `Reply with ok`。
4. 回到 LLMG 控制台，看用量或日志里是否已经出现请求。