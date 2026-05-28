[Hermes Agent](https://hermes-agent.nousresearch.com/docs) is a self-improving AI agent
built by Nous Research. It reads provider configuration from a YAML file and supports
any OpenAI-compatible endpoint as a custom provider — so you can point it at LLMG
without forks, wrappers, or schema changes.

This guide walks through adding LLMG as a Hermes custom provider, selecting an LLMG
model as the default, and verifying the connection.

> **Model selection.** LLMG exposes multiple model families (Claude, GPT, Gemini, Grok, …).
> Hermes can call any of them through the same custom provider — pick the model ID
> you want from [/pricing](/pricing) when you fill in `model.default`.

## Prerequisites

- Hermes Agent installed. Follow the [Hermes installation guide](https://hermes-agent.nousresearch.com/docs/getting-started/installation).
  Verify with `hermes --version`.
- LLMG API key created on [API keys](/keys). Copy the value — it is only shown once.
- LLMG base URL. The value is `https://llmg.oneclaw.me/v1`. Hermes expects the `/v1`
  suffix because it speaks OpenAI chat-completions.
- Available credits. Confirm balance on [Wallet](/wallet).

## Quick start

### 1. Open your Hermes config file

Hermes reads its settings from:

- **macOS / Linux:** `~/.hermes/config.yaml`
- **Windows:** `%USERPROFILE%\.hermes\config.yaml`

This is a plain YAML file on disk. Edit it with any text editor. The same file is read
by every Hermes surface — CLI, dashboard, and integrations.

- If the file does not exist (first-time setup), run `hermes setup` (full wizard) —
  or just `hermes model` for the provider/model picker alone. Either command creates
  `~/.hermes/config.yaml` with defaults; you can then add the LLMG block in step 2 by
  re-running `hermes model` or by editing the file directly.
- If the file already exists, add the new `custom_providers` entry and update the
  top-level `model` block — do not replace the file wholesale, or you will lose other
  settings.

### 2. Add LLMG as a custom provider

Append an `llmg` entry to the `custom_providers:` list. If the file already has a
`custom_providers:` list, add to it; otherwise create the list at the top level.

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

Field notes:

- `name` is the label you reference elsewhere in the config (`llmg`). Pick anything
  that does not collide with another provider in the same file.
- `base_url` must include the `/v1` suffix.
- `key_env` is the name of the environment variable Hermes should read for the API key —
  no `$` prefix and no value (the value lives in your shell environment, see step 4).
  If you would rather paste the key directly into the file, replace
  `key_env: LLMG_API_KEY` with `api_key: sk-…` and skip step 4. The `key_env` form
  is preferred so the key does not live in plain text on disk.
- `api_mode: chat_completions` tells Hermes to use the OpenAI chat-completions wire
  format. LLMG speaks this format natively.
- `models` lists the model IDs you want available for selection — the ID is the YAML
  key, and the body (`{}`) is empty unless you want per-model overrides such as
  `context_length`. Each ID must match a model from [/pricing](/pricing) exactly
  (IDs are case-sensitive). You do not have to list every model — only the ones you
  want Hermes to use.

### 3. Set LLMG as the active provider

Update the top-level `model:` block so Hermes routes by default to LLMG:

```yaml
model:
  default: claude-sonnet-4-5
  provider: custom:llmg
```

- `provider` uses the `custom:<name>` form for custom providers — the suffix (`llmg`)
  must match the `name:` you chose in step 2.
- `default` must be one of the model IDs you listed under that provider's `models:` map.

### 4. Export your API key

If you used `key_env: LLMG_API_KEY` in step 2 (recommended), export the value in the
shell that launches Hermes. Add this to `~/.zshrc`, `~/.bashrc`, or
`~/.config/fish/config.fish`:

```bash
export LLMG_API_KEY="your_api_key"
```

Then reload the shell profile so the current terminal picks up the value:

```bash
# zsh
source ~/.zshrc
# bash
source ~/.bashrc
# fish
source ~/.config/fish/config.fish
```

Alternative: Hermes also reads variables from `~/.hermes/.env`. Add
`LLMG_API_KEY=your_api_key` there if you prefer per-tool env management over a shell
profile.

If you pasted the key literally into `config.yaml` via `api_key:` instead, skip this
step.

### 5. Verify

Send a one-shot prompt with Hermes's `-z` flag:

```bash
hermes -z "Reply with 'ok' if you can see this."
```

Or run `hermes chat` for an interactive session and type the prompt there.

You have a working setup when:

1. **Hermes returns a normal answer.** A reply such as `ok` — not an error, not a
   "model not found", not a "401 unauthorized" — means the request reached LLMG and
   a model responded.
2. **The call shows up in LLMG usage.** Check the usage or logs page in the LLMG
   console; the request and its token count should appear within a few seconds, and
   your credit balance should decrease accordingly. This is the ground truth that the
   request actually went through LLMG rather than a fallback provider.

If you only see #1 but not #2, Hermes is talking to a different provider — most often
because `model.provider:` still points at an old entry, or a `fallback_providers:`
entry is being used first. Re-check step 3. You can also run `hermes doctor` for a
diagnostic on the current provider/model resolution.

## Interactive alternative — `hermes model`

If you prefer not to hand-edit YAML, Hermes ships an interactive picker that walks
you through adding a custom provider:

```bash
hermes model
```

Choose **Custom endpoint** when prompted, then enter:

- **Base URL** — `https://llmg.oneclaw.me/v1`
- **API key** — your LLMG key
- **Model name** — any model ID from [/pricing](/pricing)

Hermes persists the values into `~/.hermes/config.yaml` using the same
`custom_providers` schema shown above. The hand-edited and interactive paths produce
equivalent configs — use whichever you prefer.

## How it works

Hermes treats every provider — built-in (`anthropic`, `openrouter`, …) or custom — as
an interchangeable backend behind a single dispatch layer. When you select a custom
provider, Hermes sends the chat-completions request to `${base_url}/chat/completions`
with the configured API key. LLMG's OpenAI-compatible API accepts the request,
forwards it to the underlying model family (Claude, GPT, Gemini, …), and bills usage
against your LLMG credits.

The integration does not require any Hermes patches: LLMG is a vanilla
OpenAI-compatible target as far as Hermes is concerned. Upgrading Hermes does not
break the connection.

## Model compatibility notes

- **Switching model families** is a YAML edit. Change `model.default:` (or set it per
  call inside Hermes) to any model ID listed under your provider's `models:` map.
- **Reasoning / extra fields.** Hermes can pass extra request fields
  (`reasoning_effort`, `service_tier`, `extra_body`) through the chat-completions API.
  LLMG forwards these to the upstream model when the model family supports them;
  otherwise they are ignored.
- **Fallback providers.** Hermes's `fallback_providers:` block accepts any other custom
  provider you have configured. LLMG can be either the primary or a fallback — the
  schema is symmetric.

## Troubleshooting

**`401 Unauthorized` from `${base_url}/chat/completions`.** Your API key is missing or
malformed. If you used `key_env: LLMG_API_KEY`, verify the env var is exported in the
shell that launched Hermes (`echo $LLMG_API_KEY`). If you used `api_key:` literal,
re-copy the value from [API keys](/keys) — make sure no whitespace was pasted.

**`404 Not Found` or `model not found`.** Either the `base_url` is missing the `/v1`
suffix (Hermes expects the full chat-completions root), or the model ID under
`models:` does not match the canonical ID on [/pricing](/pricing). Model IDs are
case-sensitive.

**Hermes still uses the previous provider after editing the file.** Hermes loads
`config.yaml` at session start; a session you opened before the edit will keep the old
provider. Exit the current session and re-launch with `hermes chat` (or run
`hermes -z "<prompt>"` for a fresh one-shot) so the new YAML is picked up.
`hermes doctor` will report the resolved provider/model for the current session.

**Credits not decreasing on the dashboard.** The request did not actually hit LLMG —
usually because `model.provider:` still points at a different provider, or `base_url`
resolves to a non-LLMG host. Re-check both fields and the LLMG usage page.

## Reference

- [Hermes Agent documentation](https://hermes-agent.nousresearch.com/docs) — official
  Hermes docs (installation, configuration, skills, integrations).
- [Hermes Custom Providers reference](https://hermes-agent.nousresearch.com/docs/integrations/providers) —
  full YAML schema for `custom_providers`, including advanced fields not used in this
  guide.
- [LLMG Model catalog](/pricing) — current list of model IDs and families.
- [LLMG API reference](/docs?page=api-reference) — direct OpenAI-compatible API
  documentation.
