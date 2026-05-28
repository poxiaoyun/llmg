LLMG is a unified gateway in front of multiple model providers. From the client side, only three things need to be correct: you need a valid LLMG API key, the right base URL, and a model ID that is actually enabled on this instance.

> If your client lets you customize the endpoint, API key, or provider settings, you can usually route it through LLMG without changing the protocol your app already speaks.

## Start with the right page

| If you want to... | Open this guide |
| --- | --- |
| Send the first request and verify the gateway | [Quickstart](/docs?page=quickstart) |
| Wire a terminal-based coding agent or CLI | [CLI agents / Overview](/docs?page=cli-overview) |
| Reuse the gateway inside your editor | [VS Code extension](/docs?page=vscode-extension) |
| Check exact paths, headers, and payload fields | [API reference](/docs?page=api-reference) |

## What this docs set answers

### Where do I create a key?

You create a user-facing key in the LLMG console, not in the upstream provider. The client that talks to your app should only ever see the key issued by this gateway.

### What should I use as the base URL?

All OpenAI-compatible examples in this docs site use one gateway entry:

```text
https://llmg.oneclaw.me/v1
```

For local development, the common default is:

```text
http://localhost:3000/v1
```

### How do I find model names?

Do not assume every instance exposes the same catalog. Use one of these two checks instead:

- Open [/pricing](/pricing) to inspect the currently enabled models, pricing, and context windows.
- Call `GET /v1/models` to fetch the live model list programmatically.

## How LLMG fits into your stack

From the client point of view, LLMG behaves like your own model ingress layer:

- Your applications use a gateway-issued key instead of distributing raw upstream credentials.
- Your requests go to your own domain instead of directly targeting a single provider.
- You can change routing, pricing, or upstream strategy without teaching every client a new protocol.

## Recommended reading order

1. Finish [Quickstart](/docs?page=quickstart) and confirm you can make one successful request.
2. Open the guide that matches your actual client, usually [CLI agents](/docs?page=cli-overview) or [VS Code extension](/docs?page=vscode-extension).
3. Keep [API reference](/docs?page=api-reference) nearby when you need the exact request and response shapes.