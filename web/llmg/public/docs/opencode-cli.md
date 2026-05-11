# OpenCode CLI

OpenCode CLI 可以通过自定义 provider 接到 LLMG。它的核心配置不在 shell 里，而是在 `opencode.jsonc` 这个本地配置文件里。

## Prerequisites

- 你已经安装 Node.js 20+ 或其他 OpenCode 支持的安装方式。
- 你已经在 LLMG 中创建了 key。
- 你知道至少一个当前实例可用的模型名。

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

## 2. 准备环境变量（可选但推荐）

如果你更习惯把 key 放在 shell 里，可以先准备：

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

把下面这个 provider 块加入配置文件。模型列表请根据你自己的实例实际情况替换：

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

> Tip: 这份示例里的模型名只是模板，你应该换成自己实例在 `/pricing` 或 `/v1/models` 里能看到的模型。

## 5. 启动并选择模型

```bash
opencode
```

进入后，使用 `/model` 或 OpenCode 对应的模型选择入口，切到你刚加的 LLMG provider 模型。

## 6. Verify

发送一句最短测试提示，例如“Reply with ok if connected through LLMG.”，然后回到网关控制台确认请求已经出现。

## Troubleshooting

### provider 没出现

先检查 `opencode.jsonc` 是否真的在 OpenCode 读取的默认路径里。

### 模型不能选

说明你写进配置文件的模型名和当前实例实际可用模型不一致。

### 连接失败

优先检查 `baseURL` 是否写成完整的 `https://your-llmg-domain.com/v1`。