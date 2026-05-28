如果你的 AI 工具是一个长期运行的智能体（Agent）——通常从 YAML 或 JSON 文件读取 provider 配置，而不是每次都从环境变量里读——就从这一节开始。LLMG 暴露了 OpenAI 兼容的 inference endpoint，这些 Agent 会把它注册为自定义 provider，再通过它路由流量。

这一节目前包含 Hermes Agent。随着更多 Agent 运行时适配 LLMG，后续会持续补充。

[Hermes Agent](/docs?page=hermes-agent)

## Shared prerequisites

- 在 [API 密钥页面](/keys) 创建一把 LLMG API key。
- 如果实例启用了余额或额度机制，先到 [钱包页](/wallet) 确认可用额度。
- 明确你的 LLMG base URL，格式为 `https://llmg.oneclaw.me/v1`。
  本节所有示例均使用该地址。

## 通用配置思路

Agent 运行时通常把 provider 配置写在结构化文件（YAML、JSON 或 TOML）里，而不是每次调用时读环境变量。不管是哪个 Agent，LLMG 的接入方式都一致：

- **Provider 名称** — 你给它起的标签（例如 `llmg`、`infer`），用于在 Agent 配置里引用该 provider。
- **Base URL** — 你的 LLMG inference endpoint，需要带 `/v1` 后缀。
- **API key** — 你的 LLMG API key。
- **API 模式** — OpenAI chat completions 格式。
- **Models** — 你希望 Agent 可以选择的模型 ID。从 [/pricing](/pricing) 或 `GET /v1/models` 获取当前实例的真实模型列表。

按你使用的 Agent 选择对应的文档：

| Agent | 什么时候打开这篇 |
| --- | --- |
| [Hermes Agent](/docs?page=hermes-agent) | 你使用 Hermes 自我进化智能体，希望通过 YAML 配置将 LLMG 添加为自定义 provider。 |
