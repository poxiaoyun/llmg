Codex CLI 适合走 OpenAI 兼容协议。接入 LLMG 的核心是两步：先在 `~/.codex/config.toml` 里声明一个 LLMG provider，再通过环境变量把网关 key 交给 Codex 读取。

## Prerequisites

- 终端里可以正常运行 `node` 或 Homebrew。
- 你已经创建了一把 LLMG key。
- 你知道当前实例至少一个可用模型 ID，必要时可以去 [/pricing](/pricing) 或 `GET /v1/models` 查看。

## 1. 安装 Codex CLI

```bash
npm install -g @openai/codex
# 或者在 macOS 上：
brew install --cask codex
```

先确认命令可用：

```bash
codex --version
```

## 2. 配置 `~/.codex/config.toml`

常见路径：

- macOS / Linux：`~/.codex/config.toml`
- Windows：`%USERPROFILE%\.codex\config.toml`

如果文件不存在就新建；如果已经存在，只补充或更新 LLMG provider：

```toml
model_provider = "llmg"
model = "gpt-4o-mini"
model_reasoning_effort = "high"

[model_providers.llmg]
name = "LLMG"
base_url = "https://llmg.oneclaw.me/v1"
env_key = "LLMG_API_KEY"
```

> `base_url` 必须包含 `/v1`，否则最常见的结果就是 `404`。

## 3. 设置 API key

### macOS / Linux

```bash
export LLMG_API_KEY="your_api_key"
```

如果你希望新终端也自动生效，把同样一行加入 `~/.zshrc`、`~/.bashrc` 或你实际使用的 shell profile。

### Windows PowerShell

```powershell
$env:LLMG_API_KEY = "your_api_key"
```

如果要持久化：

```powershell
setx LLMG_API_KEY "your_api_key"
```

## 4. 启动 Codex

```bash
codex
```

如果你只是在做一轮最短验证，也可以直接发 one-shot 命令：

```bash
codex "Reply with ok if you can see this through LLMG."
```

## 5. Troubleshooting

### `model not found`

`config.toml` 里的 `model` 必须是当前实例真实启用的模型。

### `401` 或 `unauthorized`

确认启动 Codex 的那个终端环境里，`LLMG_API_KEY` 真的存在。

### `404`

优先检查 `base_url` 是否漏掉了 `/v1`。