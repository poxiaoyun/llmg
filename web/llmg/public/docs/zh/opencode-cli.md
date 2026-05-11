OpenCode CLI 可以通过自定义 provider 接入 LLMG。和其他 CLI 不同，它的关键配置通常不只在 shell 里，更常见的是落在 `opencode.jsonc` 这个本地配置文件中。

## Prerequisites

- 已安装 Node.js 20+ 或其他 OpenCode 支持的安装方式。
- 你已经创建了 LLMG key。
- 你知道当前实例至少一个可用模型名。

## 1. 安装 OpenCode

```bash
curl -fsSL https://opencode.ai/install | bash
```

或者：

```bash
npm install -g opencode-ai
```

确认命令可用：

```bash
opencode --version
```

## 2. 可选的环境变量

如果你希望把 key 放在 shell 里，可以先准备标准 OpenAI 兼容变量：

```bash
export OPENAI_API_KEY="your_api_key"
export OPENAI_BASE_URL="https://your-llmg-domain.com/v1"
```

## 3. 创建 `opencode.jsonc`

常见路径：

- macOS / Linux：`~/.config/opencode/opencode.jsonc`
- Windows：`%USERPROFILE%\.config\opencode\opencode.jsonc`

如果目录和文件不存在，先创建它们。

## 4. 添加 LLMG provider

把下面这个 provider 块加入配置文件，并把模型名替换成你自己实例的真实模型：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "llmg": {
      "name": "LLMG",
      "npm": "@ai-sdk/openai-compatible",
      "models": {
        "gpt-4o-mini": {
          "name": "LLMG gpt-4o-mini"
        },
        "claude-3-5-sonnet": {
          "name": "LLMG claude-3-5-sonnet"
        }
      },
      "options": {
        "baseURL": "https://your-llmg-domain.com/v1",
        "apiKey": "your_api_key"
      }
    }
  }
}
```

> 示例里的模型名只是模板，应该替换成你在 [/pricing](/pricing) 或 `GET /v1/models` 中看到的真实可用模型。

## 5. 启动并选择模型

```bash
opencode
```

进入后，使用 `/model` 或 OpenCode 对应的模型选择入口，切到刚刚加入的 LLMG provider 模型。

## 6. Troubleshooting

### provider 没出现

先检查 `opencode.jsonc` 是否真的放在 OpenCode 会读取的默认路径中。

### 模型不可选

说明你写进配置文件的模型名和当前实例实际可用模型不一致。

### 请求一发就失败

优先检查 `baseURL` 是否是完整的 `https://your-llmg-domain.com/v1`。