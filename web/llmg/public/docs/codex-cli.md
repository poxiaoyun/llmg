# Codex CLI

Codex CLI 适合走 OpenAI 兼容协议。把它接入 LLMG 的核心是两步：先在 `~/.codex/config.toml` 里声明一个 LLMG provider，再通过环境变量把 key 交给 Codex 读取。

## Prerequisites

- 终端里可以正常运行 `node` 或 Homebrew。
- 你已经在 LLMG 中创建了一把 key。
- 你知道当前实例可用的模型 ID，可以从 `/pricing` 或 `/v1/models` 查看。

## 1. 安装 Codex CLI

```bash
npm install -g @openai/codex
# 或者在 macOS 上：
brew install --cask codex
```

安装后先确认命令可用：

```bash
codex --version
```

## 2. 配置 `~/.codex/config.toml`

Codex CLI 和部分相关入口会读取同一个配置文件。常见路径是：

- macOS / Linux：`~/.codex/config.toml`
- Windows：`%USERPROFILE%\.codex\config.toml`

如果文件不存在，就新建一个；如果已经存在，只补充或更新下面这些字段即可：

```toml
model_provider = "llmg"
model = "gpt-4o-mini"
model_reasoning_effort = "high"

[model_providers.llmg]
name = "LLMG"
base_url = "https://your-llmg-domain.com/v1"
env_key = "LLMG_API_KEY"
```

> Tip: `base_url` 必须包含 `/v1`，否则最常见的结果就是 `404`。

## 3. 设置 API key

### macOS / Linux

```bash
export LLMG_API_KEY="your_api_key"
```

如果你希望新终端也自动生效，把同样一行加入 `~/.zshrc`、`~/.bashrc` 或对应 shell profile。

### Windows PowerShell

```powershell
$env:LLMG_API_KEY = "your_api_key"
```

如果要持久化，可以用：

```powershell
setx LLMG_API_KEY "your_api_key"
```

## 4. 启动 Codex

```bash
codex
```

如果你只是做连通性测试，也可以直接发一条 one-shot 命令：

```bash
codex "Reply with ok if you can see this through LLMG."
```

## 5. Verify

如果 Codex 能正常回复，通常说明这三件事已经同时成立：

- Codex 找到了 `~/.codex/config.toml`
- 你的 LLMG endpoint 可达
- `LLMG_API_KEY` 有效

之后再回到 LLMG 控制台看一下用量或日志，确认请求已经被记录。

## Troubleshooting

### `model not found`

配置文件中的 `model` 必须是你当前实例真实启用的模型，不要直接照抄别的环境。

### `401` 或 `unauthorized`

先确认 `echo $LLMG_API_KEY` 或 PowerShell 对应命令能打印出值。

### `404`

几乎都是 `base_url` 少了 `/v1`。