# Overview

LLMG 是一个统一的模型网关入口。对接入方来说，最重要的事情只有三件：拿到一把可用的 API key、使用正确的 base URL、选择当前实例真的可用的模型 ID。只要你的客户端支持自定义 endpoint，这套文档就会告诉你怎么接进来。

## 先从哪一页开始

- 如果你还没有发出第一条请求，直接看 [快速开始](/docs?page=quickstart)
- 如果你要在终端里接 Codex、Claude Code 或 OpenCode，打开 [CLI agents / Overview](/docs?page=cli-overview)
- 如果你在 VS Code 里驱动 AI 编码，去看 [VS Code extension](/docs?page=vscode-extension)
- 如果你要对照字段、路径和响应结构，去看 [API reference](/docs?page=api-reference)

## 这套文档默认回答什么问题

### 我去哪里拿 key

文档会告诉你从控制台的哪里创建 key，以及为什么不要直接使用上游供应商密钥。

### base URL 到底应该填什么

文档会统一使用“你的网关域名 + `/v1`”的方式说明，让你能直接映射到 SDK、桌面工具或 HTTP 客户端里。

### 模型名应该怎么找

文档不会给你一份假定所有实例都一样的固定模型表，而是告诉你应该去 `/pricing` 和 `/v1/models` 看当前实例的真实可用模型。

## LLMG 更像什么

对使用方来说，LLMG 更像是你自己的模型入口层：

- 你给应用发自己的 key，而不是把上游 key 散给每个客户端
- 你把请求发到自己的网关域名，而不是直接打到单一供应商
- 你可以在不改客户端协议的前提下切换上游、价格和策略

## 推荐阅读顺序

1. 先跑通 [Quickstart](/docs?page=quickstart)
2. 然后按你的客户端类型选择 CLI agents 或 VS Code extension
3. 最后用 [API reference](/docs?page=api-reference) 对照接口和字段