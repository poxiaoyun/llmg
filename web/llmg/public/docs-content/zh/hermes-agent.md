[Hermes Agent](https://hermes-agent.nousresearch.com/docs) 是由 Nous Research 开发的自我进化 AI 智能体。它从 YAML 文件读取 provider 配置，并将任何 OpenAI 兼容的 endpoint 注册为自定义 provider——因此你可以直接将它指向 LLMG，无需分叉、封装或修改 schema。

本文介绍如何将 LLMG 添加为 Hermes 自定义 provider、选择 LLMG 模型作为默认模型，并验证连接。

> **模型选择。** LLMG 提供多个模型系列（Claude、GPT、Gemini、Grok…）。Hermes 可通过同一个自定义 provider 调用任意模型——在填写 `model.default` 时，从 [/pricing](/pricing) 选择你想要的模型 ID 即可。

## 前提条件

- 已安装 Hermes Agent。请参考 [Hermes 安装指南](https://hermes-agent.nousresearch.com/docs/getting-started/installation)。用 `hermes --version` 验证安装。
- 已在 [API 密钥页面](/keys) 创建 LLMG API key，并复制其值（只显示一次）。
- LLMG base URL 为 `https://llmg.oneclaw.me/v1`。Hermes 需要带 `/v1` 后缀，因为它使用 OpenAI chat-completions 协议。
- 有可用额度。在 [钱包页面](/wallet) 确认余额。

## 快速开始

### 1. 打开 Hermes 配置文件

Hermes 从以下路径读取配置：

- **macOS / Linux：** `~/.hermes/config.yaml`
- **Windows：** `%USERPROFILE%\.hermes\config.yaml`

这是一个普通的 YAML 文件，用任意文本编辑器打开即可。CLI、控制台、集成等所有 Hermes 界面都读取同一个文件。

- 若文件不存在（首次使用），运行 `hermes setup`（完整向导）或 `hermes model`（只做 provider/model 选择）。任意一个命令都会生成默认的 `~/.hermes/config.yaml`，然后你可以在第 2 步追加 LLMG 相关配置。
- 若文件已存在，**只添加**新的 `custom_providers` 条目并更新顶层的 `model` 块——不要整文件替换，否则会丢失其他设置。

### 2. 将 LLMG 添加为自定义 provider

在文件的 `custom_providers:` 列表中追加一个 `llmg` 条目。若文件里已有 `custom_providers:` 列表就直接追加；若没有则在顶层创建该列表。

```yaml
custom_providers:
  - name: llmg
    base_url: "https://llmg.oneclaw.me/v1"
    key_env: LLMG_API_KEY
    api_mode: chat_completions
    models:
      claude-opus-4-5: {}
      claude-sonnet-4-5: {}
      gpt-4o: {}
      gpt-4o-mini: {}
      gemini-2.5-flash: {}
```

字段说明：

- `name` 是你在配置中引用该 provider 时使用的标签（本例为 `llmg`），可以自取，不要与其他已有 provider 冲突。
- `base_url` 必须带 `/v1` 后缀。
- `key_env` 是 Hermes 读取 API key 时使用的环境变量名（不带 `$` 前缀，不写值）。如果你更倾向于直接把 key 写在文件里，可将 `key_env: LLMG_API_KEY` 替换为 `api_key: sk-…`，并跳过第 4 步。推荐使用 `key_env` 方式，避免 key 明文存储在磁盘上。
- `api_mode: chat_completions` 告诉 Hermes 使用 OpenAI chat-completions 的数据格式，LLMG 原生支持该格式。
- `models` 列出你想让 Hermes 使用的模型 ID——YAML key 是模型 ID，值（`{}`）为空，除非你需要为某个模型设置单独的参数（例如 `context_length`）。模型 ID 必须与 [/pricing](/pricing) 上的完全一致（区分大小写），不需要列出所有模型，只列你要用的即可。

### 3. 将 LLMG 设为当前使用的 provider

更新顶层的 `model:` 块，让 Hermes 默认路由到 LLMG：

```yaml
model:
  default: claude-sonnet-4-5
  provider: custom:llmg
```

- `provider` 中自定义 provider 使用 `custom:<name>` 格式——后缀（`llmg`）必须与第 2 步中你设置的 `name:` 一致。
- `default` 必须是你在该 provider 的 `models:` 映射中列出的模型 ID 之一。

### 4. 导出 API key

如果你在第 2 步选择了 `key_env: LLMG_API_KEY`（推荐方式），需要在启动 Hermes 的 shell 中导出该变量。将以下行添加到 `~/.zshrc`、`~/.bashrc` 或 `~/.config/fish/config.fish`：

```bash
export LLMG_API_KEY="your_api_key"
```

然后重新加载配置，让当前终端生效：

```bash
# zsh
source ~/.zshrc
# bash
source ~/.bashrc
# fish
source ~/.config/fish/config.fish
```

另一种方式：Hermes 也会读取 `~/.hermes/.env` 文件，你可以将 `LLMG_API_KEY=your_api_key` 写在那里。

如果你在 `config.yaml` 中使用了 `api_key:` 直接填写 key，跳过本步骤。

### 5. 验证

使用 Hermes 的 `-z` 参数发一条单次对话：

```bash
hermes -z "如果你能看到这条消息，请回复'ok'。"
```

或者运行 `hermes chat` 进入交互模式再输入提示词。

成功的标志：

1. **Hermes 返回正常回答。** 收到类似 `ok` 的回复——不是报错、不是"model not found"、不是"401 unauthorized"——说明请求到达了 LLMG 并且模型正常响应。
2. **LLMG 用量页面出现该请求。** 在 LLMG 控制台的用量或日志页面，请求和对应的 token 数量应在数秒内显示，余额也应随之减少。这才是请求真正经过 LLMG 的直接证明。

如果只有第 1 点而没有第 2 点，说明 Hermes 连接的是其他 provider——通常是因为 `model.provider:` 还在指向旧的条目，或者优先走了 `fallback_providers:`。重新检查第 3 步，也可以运行 `hermes doctor` 诊断当前的 provider/model 解析结果。

## 交互式替代方案 — `hermes model`

如果不想手动编辑 YAML，Hermes 提供交互式选择器，引导你逐步添加自定义 provider：

```bash
hermes model
```

在提示中选择 **Custom endpoint**，然后输入：

- **Base URL** — `https://llmg.oneclaw.me/v1`
- **API key** — 你的 LLMG key
- **Model name** — 从 [/pricing](/pricing) 选择任意模型 ID

Hermes 会将这些值写入 `~/.hermes/config.yaml` 的 `custom_providers` 结构中，与手动编辑的结果完全等价，按喜好选择即可。

## 工作原理

Hermes 把每个 provider——内置的（如 `anthropic`、`openrouter`）或自定义的——都视为调度层后面可互换的后端。选择自定义 provider 后，Hermes 使用配置的 API key 向 `${base_url}/chat/completions` 发送 chat-completions 请求。LLMG 的 OpenAI 兼容 API 接收请求，将其转发给底层模型系列（Claude、GPT、Gemini…），并从你的 LLMG 额度中扣费。

整个集成不需要对 Hermes 做任何修改：LLMG 对 Hermes 来说就是一个普通的 OpenAI 兼容目标。升级 Hermes 不会影响此连接。

## 模型兼容性说明

- **切换模型系列** 只需改 YAML。将 `model.default:` 改为 provider 的 `models:` 映射中的任意模型 ID 即可（也可在 Hermes 中按请求设置）。
- **推理/额外字段。** Hermes 可通过 chat-completions API 传递额外请求字段（如 `reasoning_effort`、`service_tier`、`extra_body`）。LLMG 在底层模型支持时会透传这些字段，不支持时则忽略。
- **备用 provider。** Hermes 的 `fallback_providers:` 块接受任何已配置的自定义 provider。LLMG 可以作为主 provider 或备用 provider，配置格式完全对称。

## 故障排查

**`${base_url}/chat/completions` 返回 `401 Unauthorized`。** API key 缺失或格式有误。如果使用了 `key_env: LLMG_API_KEY`，确认启动 Hermes 的 shell 中已导出该变量（`echo $LLMG_API_KEY`）；如果使用了 `api_key:` 字面量，请从 [API 密钥页面](/keys) 重新复制，注意不要有多余空格。

**`404 Not Found` 或 `model not found`。** 原因通常是：`base_url` 缺少 `/v1` 后缀（Hermes 需要完整的 chat-completions 根路径），或 `models:` 中的模型 ID 与 [/pricing](/pricing) 上的规范 ID 不符（区分大小写）。

**编辑配置文件后 Hermes 仍使用旧 provider。** Hermes 在会话开始时加载 `config.yaml`；在本次编辑之前打开的会话会继续使用旧 provider。退出当前会话，重新运行 `hermes chat` 或 `hermes -z "<提示词>"` 以加载新配置。`hermes doctor` 可报告当前会话解析到的 provider/model。

**控制台余额没有减少。** 请求实际上没有打到 LLMG——通常是因为 `model.provider:` 还指向其他 provider，或 `base_url` 解析到了非 LLMG 的主机。重新检查这两个字段以及 LLMG 的用量页面。

## 参考资料

- [Hermes Agent 文档](https://hermes-agent.nousresearch.com/docs) — 官方 Hermes 文档（安装、配置、技能、集成等）。
- [Hermes 自定义 Provider 参考](https://hermes-agent.nousresearch.com/docs/integrations/providers) — `custom_providers` 的完整 YAML schema，包含本文未涉及的高级字段。
- [LLMG 模型目录](/pricing) — 当前模型 ID 及系列列表。
- [LLMG API 参考](/docs?page=api-reference) — OpenAI 兼容 API 文档。
