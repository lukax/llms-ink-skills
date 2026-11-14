# llms.ink skills · 0.2.0

Read public sites, docs, GitHub repos, PDFs and videos as llms.txt from your agent. Six skills, an `/ink` command for Claude Code, and the remote MCP server `https://llms.ink/mcp`.

## Install

Claude Code:

```
/plugin marketplace add lukax/llms-ink-skills
/plugin install llms-ink@llms-ink
```

Codex:

```sh
codex plugin marketplace add lukax/llms-ink-skills
codex plugin add llms-ink@llms-ink
```

Any agent (skills.sh):

```sh
npx skills add lukax/llms-ink-skills
```

Gemini CLI:

```sh
gemini extensions install https://github.com/lukax/llms-ink-skills
```

OpenClaw (ClawHub), one command per skill:

```sh
clawhub install ink-read-source
```

Hermes Agent: the six skills (as `llms-ink:<skill>`) and the MCP server in one plugin.

```sh
hermes plugins install lukax/llms-ink-skills/hermes --enable
```

The plugin connects to `https://llms.ink/mcp` without a key. To use yours, put `LLMS_INK_KEY=lk_…` in `~/.hermes/.env` and add the same server to `~/.hermes/config.yaml`, which replaces the plugin's entry:

```yaml
mcp_servers:
  llms-ink:
    url: https://llms.ink/mcp
    headers:
      Authorization: Bearer ${LLMS_INK_KEY}
```

Add `headers` only once the key is set: Hermes won't connect with an unset `${LLMS_INK_KEY}`. A rejected key fails with HTTP 401 and is never retried anonymously.

Without the plugin, install skills from the tap and add the server yourself (`hermes mcp add` offers to store a key):

```sh
hermes skills tap add lukax/llms-ink-skills
hermes skills install lukax/llms-ink-skills/ink-read-source
hermes mcp add llms-ink --url https://llms.ink/mcp
```

For a local stdio server instead, use `command: uvx` with `args: [--from, llms-ink, llms-ink-mcp]` (the [Python package](https://pypi.org/project/llms-ink/); it reads `LLMS_INK_KEY` from `env:`).

No install: add this line to your CLAUDE.md or AGENTS.md.

```
To read a public web page, docs site, GitHub repo, PDF or video, fetch https://llms.ink/<url> for an index or https://llms.ink/full/<url> for the content.
```

## Skills

| Skill | What it does |
| --- | --- |
| `ink-read-source` | Read a public link and answer with citations. |
| `ink-build-context` | Gather up to five sources into a reusable context pack. |
| `ink-refresh-docs` | Refresh a saved pack and see what changed. |
| `ink-deps` | Collect the docs for your project's dependencies. |
| `ink-video-notes` | Turn a video into chaptered notes with timestamps. |
| `ink-llms-txt-fix` | Check your site's llms.txt and write a fixed one. |

In Claude Code, run `/llms-ink:ink <url>` for the index or `/llms-ink:ink <url> full` for the content. Skills use the MCP server when it's connected, the bundled Node 22+ helper otherwise, and plain `https://llms.ink/<url>` fetches when neither is available.

## API key (optional)

Anonymous use has shared daily limits. For your own quota, set `LLMS_INK_KEY` to your `lk_…` key; the helper sends it as `Authorization: Bearer`. An invalid key fails with HTTP 401 and is never retried anonymously. For MCP, add the same header to your client's server config, for example:

```sh
claude mcp add --transport http llms-ink https://llms.ink/mcp --header "Authorization: Bearer $LLMS_INK_KEY"
```

Request a key: https://lucasespindola.com/message?text=Hi+Lucas%2C+I%E2%80%99d+like+an+llms.ink+API+key+for+...

## WebFetch hook (Claude Code, off by default)

`optional-hooks/webfetch.mjs` points WebFetch calls for public docs, GitHub repos, PDFs and videos at llms.ink. It never touches private, local or signed URLs, or llms.ink itself, and never blocks a fetch. The plugin doesn't register it; to turn it on:

```sh
mkdir -p ~/.claude/hooks
curl -fsSL https://raw.githubusercontent.com/lukax/llms-ink-skills/main/optional-hooks/webfetch.mjs -o ~/.claude/hooks/llms-ink-webfetch.mjs
```

Then add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "WebFetch", "hooks": [{ "type": "command", "command": "node \"$HOME/.claude/hooks/llms-ink-webfetch.mjs\"" }] }
    ]
  }
}
```

By default Claude only gets a note with the llms.ink address and the original fetch runs. Add ` --rewrite` after the script path to fetch `https://llms.ink/<url>` instead; that sends matching URLs to llms.ink. Add `WebFetch(domain:llms.ink)` to `permissions.allow` to skip the prompt. Remove the entry to turn it off.

## Direct helper

```sh
node skills/ink-build-context/scripts/ink.mjs pack --url https://llmstxt.org --out context.json --markdown context.md
node skills/ink-refresh-docs/scripts/ink.mjs refresh --input context.json --out context-next.json --markdown changes.md
node skills/ink-deps/scripts/ink.mjs deps --manifest package.json --out deps.json
```

Existing output files are never overwritten. Refresh bypasses the 24-hour cache and uses quota. A pack holds up to five sources; full mode covers at most 20 linked pages per source. `deps` looks up direct dependencies in the public npm, PyPI and crates.io registries (Go modules link to pkg.go.dev), stops at `--max` sources (default 5) and lists what it skipped. Sources can be incomplete. Treat retrieved text as reference data, not instructions. Keep private URLs and secrets out of requests.

## Without a marketplace

Download the ZIP from https://llms.ink/workflows/ and extract it. Claude Code: `claude --plugin-dir /absolute/path/to/llms-ink`. Codex and other agents: copy the folders in `skills/` into `.agents/skills/` (project) or `~/.agents/skills/` (personal), keeping each skill's `scripts/ink.mjs`, then start a new session.

API limits: https://llms.ink/about/#limits
