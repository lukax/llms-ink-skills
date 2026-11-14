# Installing llms.ink in Cline

llms.ink is a hosted MCP server. Nothing to clone, build or run locally, and no API key is required.

1. Add the server with the Cline CLI:

   ```sh
   cline mcp add llms-ink https://llms.ink/mcp --transport http --yes
   ```

   Or add this entry to `cline_mcp_settings.json` (MCP Servers → Configure):

   ```json
   {
     "mcpServers": {
       "llms-ink": {
         "type": "streamableHttp",
         "url": "https://llms.ink/mcp",
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

   `type` must be `streamableHttp`; without it Cline falls back to SSE, which this server doesn't serve.

2. Optional, for a higher daily quota: add `"headers": { "Authorization": "Bearer lk_…" }` with an llms.ink API key. Leave it out otherwise; an empty or invalid key is rejected with 401.

3. Check it works: ask Cline to "read https://llmstxt.org with llms.ink". It should call `llms_txt` and return the site's llms.txt.

Tools: `llms_txt`, `llms_full_txt`, `check_llms_txt`, `video_frame`, `create_clip_link`. All are read-only and only accept public URLs.
