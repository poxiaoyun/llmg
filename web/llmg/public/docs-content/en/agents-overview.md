Use this section when your AI tool is a long-running agent — typically a runtime
that loads provider config from a YAML or JSON file rather than reading
environment variables on every call. LLMG exposes an OpenAI-compatible inference
endpoint that these agents register as a custom provider, then route traffic through.

This section currently covers Hermes Agent. Additional agent integrations will be
added as further runtimes adopt the format.

[Hermes Agent](/docs?page=hermes-agent)

## Shared prerequisites

- Create an LLMG API key on [API keys](/keys).
- If your instance enforces balance or quota, confirm it on [Wallet](/wallet).
- Know your LLMG base URL — it follows the pattern `https://llmg.oneclaw.me/v1`.
  All snippets below assume this base URL.

## Common configuration pattern

Agent runtimes typically store provider configuration in a structured file
(YAML, JSON, or TOML) rather than environment variables. LLMG integrates the
same way regardless of agent:

- **Provider name** — a label you pick (`llmg`, `infer`, etc.) — used elsewhere
  in the agent config to select the provider.
- **Base URL** — your LLMG inference endpoint, including the `/v1` suffix.
- **API key** — your LLMG API key.
- **API mode** — OpenAI-style chat completions.
- **Models** — the model IDs you want the agent to be able to select from. Get
  the canonical list from [/pricing](/pricing) or call `GET /v1/models`.

Pick the guide below for the exact config schema your agent expects.

| Agent | Open this page when... |
| --- | --- |
| [Hermes Agent](/docs?page=hermes-agent) | You use the Hermes self-improving agent and want to add LLMG as a custom provider via YAML config. |
