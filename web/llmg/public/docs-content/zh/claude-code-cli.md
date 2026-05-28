如果你使用 Claude Code CLI，接入 LLMG 时应该走 Anthropic 兼容路径，而不是 OpenAI 兼容路径。关键点是：使用 `ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN`，并把 `ANTHROPIC_API_KEY` 显式置空，避免 CLI 回退到默认 Anthropic 地址。

## Prerequisites

- 你已经安装或准备安装 Claude Code CLI。
- 你已经有一把 LLMG key。
- 你准备调用的是当前实例启用的 Claude 系列模型。

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

```bash
ANTHROPIC_BASE_URL="https://llmg.oneclaw.me/v1" \
ANTHROPIC_AUTH_TOKEN="your_api_key" \
ANTHROPIC_API_KEY="" \
ANTHROPIC_MODEL="claude-3-5-sonnet" \
claude
```

### 当前 shell 会话

```bash
export LLMG_API_KEY="your_api_key"
export ANTHROPIC_BASE_URL="https://llmg.oneclaw.me/v1"
export ANTHROPIC_AUTH_TOKEN="$LLMG_API_KEY"
export ANTHROPIC_API_KEY=""
export ANTHROPIC_MODEL="claude-3-5-sonnet"
```

> `ANTHROPIC_API_KEY` 需要显式置空，否则 Claude Code 可能优先读取它并回退到默认 Anthropic 地址。

## 3. 选择模型

建议只使用当前实例真实启用的 Claude 系列模型，例如：

- `claude-3-5-sonnet`
- `claude-3-5-haiku`
- 你在 [/pricing](/pricing) 里能看到的其他 Claude 模型

## 4. Verify

```bash
claude "Reply with ok if this request reached LLMG."
```

只要能拿到正常回复，通常就说明环境变量、网关路径和 key 都没问题。

## 5. Troubleshooting

### 认证异常

优先确认 `ANTHROPIC_AUTH_TOKEN` 里放的是 LLMG key，而不是上游供应商 key。

### 模型错误

检查 `ANTHROPIC_MODEL` 是否真的是当前实例允许的 Claude 模型。

### `404`

确认 `ANTHROPIC_BASE_URL` 指向你的 LLMG 网关，并且没有漏掉 `/v1`。