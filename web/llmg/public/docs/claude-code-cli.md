# Claude Code CLI

如果你使用 Claude Code CLI，接入 LLMG 时要走 Anthropic 兼容路径，而不是 OpenAI 兼容路径。关键点是：使用 `ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN`，并且把 `ANTHROPIC_API_KEY` 显式置空。

## Prerequisites

- 你已经安装或准备安装 Claude Code CLI。
- 你已经有一把 LLMG key。
- 你计划调用的是 Claude 系列模型，而不是任意 OpenAI 风格模型。

## 1. 安装 Claude Code CLI

### macOS / Linux / WSL

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### Windows PowerShell

```powershell
irm https://claude.ai/install.ps1 | iex
```

也可以使用 npm 方式安装：

```bash
npm install -g @anthropic-ai/claude-code
```

验证命令：

```bash
claude --version
```

## 2. 配置环境变量

### 一次性验证

如果你只是先测通连接，可以直接在启动命令前临时加变量：

```bash
ANTHROPIC_BASE_URL="https://your-llmg-domain.com/v1" \
ANTHROPIC_AUTH_TOKEN="your_api_key" \
ANTHROPIC_API_KEY="" \
ANTHROPIC_MODEL="claude-3-5-sonnet" \
claude
```

### 当前 shell 会话

```bash
export LLMG_API_KEY="your_api_key"
export ANTHROPIC_BASE_URL="https://your-llmg-domain.com/v1"
export ANTHROPIC_AUTH_TOKEN="$LLMG_API_KEY"
export ANTHROPIC_API_KEY=""
export ANTHROPIC_MODEL="claude-3-5-sonnet"
```

> Tip: `ANTHROPIC_API_KEY` 需要显式置空，否则 Claude Code 可能优先读取它并回退到默认 Anthropic 地址。

## 3. 选择模型

Claude Code 这条路建议只使用当前实例里真正启用的 Claude 系列模型，例如：

- `claude-3-5-sonnet`
- `claude-3-5-haiku`
- 你实例里在 `/pricing` 明确显示可用的其他 Claude 模型

如果你填了 OpenAI 或 Gemini 风格模型名，这条链路很容易直接失败。

## 4. Verify

先发一条最短提示：

```bash
claude "Reply with ok if this request reached LLMG."
```

只要你拿到正常回复，就表示：

- CLI 能看到当前环境变量
- LLMG 的 Anthropic 兼容入口可达
- 这把 key 有效

## Troubleshooting

### 没有响应或认证异常

优先确认 `ANTHROPIC_AUTH_TOKEN` 是否真的是 LLMG key，而不是上游 key。

### 模型错误

优先检查 `ANTHROPIC_MODEL` 是否是当前实例允许的 Claude 模型。

### 404 或路径不对

先确认 `ANTHROPIC_BASE_URL` 指向的是你的 LLMG 网关，并且不要少掉 `/v1`。