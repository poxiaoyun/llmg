# VS Code extension

如果你在 VS Code 里通过 OpenAI 的 ChatGPT / Codex 扩展驱动编码工作流，通常可以直接复用 Codex CLI 的配置文件。也就是说，只要 `~/.codex/config.toml` 已经正确指向 LLMG，扩展端基本不需要再单独维护一套 provider 配置。

## Prerequisites

- 已安装 VS Code。
- 已安装 OpenAI 的扩展，例如 `openai.chatgpt` 这一类会读取 Codex 配置的扩展。
- 已在 LLMG 中创建好 key。
- 最好先完成一轮 [Codex CLI](/docs?page=codex-cli) 配置。

## Environment (macOS / Linux)

如果扩展通过环境变量读取 key，先在 shell 中导出：

```bash
export LLMG_API_KEY="your_api_key"
```

如果你把它写进了 `~/.zshrc` 或 `~/.bashrc`，记得 reload 当前 shell：

```bash
source ~/.zshrc
# 或者
source ~/.bashrc
```

## Environment (Windows PowerShell)

```powershell
$env:LLMG_API_KEY = "your_api_key"
```

如果你需要跨会话持久化：

```powershell
setx LLMG_API_KEY "your_api_key"
```

## Codex config

如果你还没有配置过 Codex，请在 `~/.codex/config.toml` 中加入 LLMG provider：

```toml
model_provider = "llmg"
model = "gpt-4o-mini"

[model_providers.llmg]
name = "LLMG"
base_url = "https://your-llmg-domain.com/v1"
env_key = "LLMG_API_KEY"
```

> Tip: 扩展如果复用的是 Codex 配置，最常见的问题不是扩展本身，而是 VS Code 启动时没有继承到你刚刚导出的环境变量。

## Launch

最稳妥的启动方式是从已经导出变量的终端里启动 VS Code：

```bash
cd your-project
code .
```

这样扩展更容易拿到当前 shell 里的 `LLMG_API_KEY`。

## Verify

打开扩展面板后，发送一句很短的测试提示，例如：

```text
Reply with 'ok' if you can see this.
```

如果得到正常回复，再回 LLMG 控制台看一下用量或日志是否有对应请求。

## Troubleshooting

### 扩展里仍然报 401

多数情况是因为 VS Code 不是从导出过变量的终端启动的。

### 模型不可用

`config.toml` 中的模型必须是当前实例可用模型，而不是别处的示例模型。

### 改完配置没有生效

重启 VS Code 和扩展，再重新发测试提示。