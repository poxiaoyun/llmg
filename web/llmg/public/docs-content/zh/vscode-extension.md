如果你在 VS Code 里通过 OpenAI 或 Codex 扩展驱动编码工作流，通常可以直接复用已经在终端里跑通的 Codex 配置。也就是说，扩展侧最关键的事情通常不是单独维护另一套 provider，而是确保 VS Code 能看到和 Codex CLI 相同的环境变量与 `~/.codex/config.toml`。

## Prerequisites

- 已安装 VS Code。
- 你使用的是会读取 Codex 配置流的 OpenAI 或 Codex 扩展。
- 已在 LLMG 中创建好 key。
- 最好已经先完成一轮 [Codex CLI](/docs?page=codex-cli) 配置。

## 导出 key

### macOS / Linux

```bash
export LLMG_API_KEY="your_api_key"
```

如果你把它写进了 `~/.zshrc` 或 `~/.bashrc`，记得在启动 VS Code 之前 reload 当前 shell：

```bash
source ~/.zshrc
# 或者
source ~/.bashrc
```

### Windows PowerShell

```powershell
$env:LLMG_API_KEY = "your_api_key"
```

如果需要跨会话持久化：

```powershell
setx LLMG_API_KEY "your_api_key"
```

## 确认 Codex 配置指向 LLMG

如果你还没有配置过，请在 `~/.codex/config.toml` 中加入 LLMG provider：

```toml
model_provider = "llmg"
model = "gpt-4o-mini"

[model_providers.llmg]
name = "LLMG"
base_url = "https://llmg.oneclaw.me/v1"
env_key = "LLMG_API_KEY"
```

> 扩展复用 Codex 配置时，最常见的问题不是扩展本身，而是 VS Code 启动时没有继承到你刚刚设置好的环境变量。

## 从准备好的终端启动 VS Code

最稳妥的方式是从已经导出变量的终端里启动：

```bash
cd your-project
code .
```

## Verify

打开扩展面板后，发送一句很短的测试提示，例如：

```text
Reply with 'ok' if you can see this.
```

然后回到 LLMG 控制台，确认请求已经出现在用量或日志中。

## Troubleshooting

### 扩展里仍然报 `401`

大多数情况是因为 VS Code 不是从已经导出过变量的终端启动的。

### 模型不可用

`config.toml` 中的模型必须是当前实例真实可用的模型。

### 改完配置没有生效

重启 VS Code 和扩展宿主，再重新发送测试提示。