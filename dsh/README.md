# llms.ink for DeepSeek Harness

```sh
dsh plugin --profile web add "github:lukax/llms-ink-skills#path:/dsh"
```

`dsh plugin` runs pnpm, which needs `pnpm` and `git` on your PATH. The bundle adds the remote MCP server https://llms.ink/mcp to the profile; its tools appear as `mcp__llms-ink__<tool>`. Use another profile name for `tui`, `headless` or your own. Set `LLMS_INK_KEY` to your `lk_…` key before starting `dsh` for your own quota. Remove it with `dsh plugin --profile web remove dsh-llms-ink`.

For the skills, run `npx skills add lukax/llms-ink-skills`: DSH reads `~/.agents/skills`.

Generated from the repository root by the llms.ink sync script: edit the root files, not these.
