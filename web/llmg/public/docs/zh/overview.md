LLMG 是一个统一的模型网关入口。对接入方来说，真正需要确认的只有三件事：拿到一把可用的 LLMG API key、使用正确的 base URL、选择当前实例实际启用的模型 ID。

> 只要你的客户端支持自定义 endpoint、API key 或 provider 配置，通常就可以在不改协议的前提下接入 LLMG。

## 先从哪一页开始

| 你的目标 | 对应文档 |
| --- | --- |
| 跑通第一条请求并验证网关 | [快速开始](/docs?page=quickstart) |
| 在终端里接入编码智能体或 CLI | [CLI agents / Overview](/docs?page=cli-overview) |
| 在编辑器里复用同一套网关配置 | [VS Code extension](/docs?page=vscode-extension) |
| 查看精确路径、头部和字段定义 | [API reference](/docs?page=api-reference) |

## 这套文档默认回答什么问题

### 我去哪里创建 key

应该在 LLMG 控制台里创建面向应用的 key，而不是把上游供应商的原始 key 直接发给客户端。

### base URL 到底填什么

所有 OpenAI 兼容示例都会使用同一个网关入口：

```text
https://your-llmg-domain.com/v1
```

本地开发常见默认值：

```text
http://localhost:3000/v1
```

### 模型名应该去哪里找

不要假设每个实例的模型列表都相同，建议只用下面两种方式确认：

- 打开 [/pricing](/pricing) 查看当前实例已启用的模型、价格和上下文。
- 调用 `GET /v1/models`，从程序里读取实时模型列表。

## LLMG 在你的链路里更像什么

从客户端视角看，LLMG 更像是你自己的模型入口层：

- 应用拿到的是网关发放的 key，而不是散落在各处的上游密钥。
- 请求发往你自己的网关域名，而不是直接打到单一模型厂商。
- 你可以在不修改客户端协议的前提下，调整上游路由、价格和策略。

## 推荐阅读顺序

1. 先跑通 [Quickstart](/docs?page=quickstart)，确认第一条请求成功。
2. 再按实际使用的客户端去看 [CLI agents](/docs?page=cli-overview) 或 [VS Code extension](/docs?page=vscode-extension)。
3. 集成过程中需要对照字段时，随时打开 [API reference](/docs?page=api-reference)。