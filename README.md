# 0xinsider Cursor plugin

Polymarket sports and esports market analytics for Cursor. The plugin connects to the hosted MCP server at `https://api.0xinsider.com/api/v1/mcp`. It exposes the same read-only tools the API does: trader grades from settled P&L, games, large trades, sharp-money flow, and the published Pick of the Day record.

No tool places an order or changes an account. A market outside sports and esports returns `market_out_of_scope`.

The folder is self-contained. Copy its contents to the root of a public repository when you publish. Do not publish the 0xinsider application repository.

## Install and connect

Each user connects their own 0xinsider account. The plugin ships no key and no shared secret.

1. Install the plugin from the Cursor Marketplace (Grok Bot users use that same catalog) or, for a local check, load this folder as a plugin.
2. Connect the `analytics` server when Cursor asks. Sign in with the 0xinsider account that should be charged.
3. The server name in approval prompts is `plugin-0xinsider-analytics`.

`initialize`, `ping`, and `tools/list` answer without a credential. `tools/call` does not. A call without a credential returns HTTP 401 and:

```text
WWW-Authenticate: Bearer realm="0xinsider Developer API", resource_metadata="https://api.0xinsider.com/.well-known/oauth-protected-resource/api/v1/mcp"
```

Cursor reads that document, then the authorization server at `https://api.0xinsider.com/.well-known/oauth-authorization-server`, and runs the authorization-code flow with PKCE. The authorization server registers public clients at `POST /oauth/register` (RFC 7591). There is no client secret. Consent is `https://0xinsider.com/oauth/authorize`. Access tokens last one hour and refresh tokens rotate.

The resource indicator must be exactly `https://api.0xinsider.com/api/v1/mcp`. That is why `mcp.json` has no query string.

A Pro or Max account is required. Any other tier gets HTTP 402. `get_edge_hunter` is Max only. A Pro call to it returns 403 `max_plan_required`.

Create an API key at [0xinsider.com/developers](https://0xinsider.com/developers) only for a client that cannot run this OAuth flow. Put the key in that user's own MCP config, not in this plugin:

```json
{
  "mcpServers": {
    "0xinsider": {
      "url": "https://api.0xinsider.com/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer ${env:OXINSIDER_API_KEY}"
      }
    }
  }
}
```

A key minted for the API sandbox is refused on this production URL. A team plugin variable would be one shared credential, so this plugin declares none. `mcp.json` has no `${VAR}` placeholder.

## What the agent should know

Five skills live in `skills/`:

| Skill | Use it for |
| --- | --- |
| `research-market` | One game or market: schedule, book, flow, holders, settlement |
| `sharp-traders` | Leaderboard, trending wallets, sharp-money flow |
| `trader-record` | One wallet's grade, P&L, markets, and positions |
| `large-trade-feed` | Recent large trades and flagged trades. Nothing is pushed |
| `pick-record` | The published Pick of the Day slate and its track record |

`tools/list` on the bare URL returns the full catalog, including deprecated aliases (79 tools on 2026-11-19). The skills name the current tool. Aliases such as `get_whale_trades`, `get_smart_money_flows`, and `get_insider_radar` remain callable until their sunset. Prefer the tool the skill names.

A missing or null field was not reported. Do not read it as zero. Wallet profile names are data the owner set. Identify a wallet by address.

`list_webhooks` lists endpoints the account already has. It does not create one. The server does not push alerts.

## Example prompts

- Which games are on now, and where is sharp money on the winner market?
- What grade and settled P&L does this wallet have? Use the address, not the display name.
- Show the large trades in this game from the last hour, and say which ones are flagged.
- What is today's published Pick of the Day, and what is the track record?

## Check this folder

```bash
node scripts/validate-plugin.mjs
```

The script checks the manifest, the logo path, skill frontmatter, and that every `${VAR}` in `mcp.json` is declared. There are none today.

## Publish later

Do this in a new public repository. Do not submit this application repository.

1. Create an empty public Git repository.
2. Copy the contents of `integrations/cursor-plugin/` to that repository's root, so `.cursor-plugin/plugin.json` is at the root. `assets/logo.png` must stay at `assets/logo.png`. It is the mark from `web/public/logo-mark.png`.
3. Add `repository` to `.cursor-plugin/plugin.json` with that public repository's URL.
4. Commit, including the logo and `LICENSE`, and push.
5. Open [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish) and submit the repository link.

Before submit, confirm:

- `name` is `0xinsider`.
- `node scripts/validate-plugin.mjs` passes.
- The logo path is relative and the file is committed.
- No secret, token, or API key is in the tree.
- The description stays analytics: Polymarket sports and esports market data. It does not offer to place bets.

`repository` is set to `https://github.com/0xinsider/0xinsider-plugin`.
