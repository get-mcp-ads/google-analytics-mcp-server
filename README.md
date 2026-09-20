<div align="center">

# Google Analytics 4 MCP server

### Understand what happens after the click.

Explore traffic, conversions, funnels and property configuration through a read-only MCP server.

[![Release](https://img.shields.io/github/v/release/getmcpads-com/google-analytics-mcp-server?color=2448e5)](https://github.com/getmcpads-com/google-analytics-mcp-server/releases/latest)
[![CI](https://github.com/getmcpads-com/google-analytics-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/getmcpads-com/google-analytics-mcp-server/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.12-brightgreen.svg)](package.json)

[Watch the demo](https://www.getmcpads.com/home/film/get-mcp-ads-film-1080p.mp4) · [What's new](#whats-new) · [Install](#install-this-release) · [Tool reference](#tools) · [Try hosted getmcpads](https://www.getmcpads.com/tools/ga4?utm_source=github&utm_medium=readme&utm_campaign=google-analytics)

[![Watch the getmcpads product demo: campaign review in Claude](https://www.getmcpads.com/home/film/poster-rich.webp)](https://www.getmcpads.com/home/film/get-mcp-ads-film-1080p.mp4)

**[Play the 27-second product film](https://www.getmcpads.com/home/film/get-mcp-ads-film-1080p.mp4)**

</div>

The film demonstrates hosted getmcpads with staged data. Its creative galleries and MCP Apps interface belong to the hosted product. This repository provides the standalone native API tools.

**27 read tools** · Read-only by design.

Run locally with your own platform credentials and a client that supports stdio MCP, such as Claude Desktop, Claude Code or Cursor. Your requests go directly to the platform. For managed connections, including supported ChatGPT setups, use the hosted option.

## What's new

**[v2.0.0: Native tools and security update](https://github.com/getmcpads-com/google-analytics-mcp-server/releases/tag/v2.0.0) · September 20, 2026**

- Confirm the current native 27-tool read catalog against the hosted implementation.
- Retain standalone OAuth and redirect protections; no hosted account-selection or application database dependency is introduced.
- Require Node.js 22.12 or newer and check Node 22/24 in CI.
- Update vulnerable dependencies and regenerate the MCP catalog.

[Full changelog](CHANGELOG.md) · [Source synchronization details](SOURCE_SYNC.md) · [All releases](https://github.com/getmcpads-com/google-analytics-mcp-server/releases)

### Upgrade notes

Requires **Node.js 22.12 or newer**. CI covers Node 22 and 24. Version 2.0.0 drops Node 18 and 20 support. Hosted creative integrations and MCP Apps UI are outside this release.

## Install this release

This is a GitHub source release. npm and MCP Registry versions are published separately. The commands below select this exact version; unpinned `npx` examples later in this document select the version currently available on npm.

```bash
git clone --branch v2.0.0 --depth 1 https://github.com/getmcpads-com/google-analytics-mcp-server.git
cd google-analytics-mcp-server
npm ci
npm run build
```

Configure your MCP client to run `node` with the absolute path to `dist/cli.js` and the platform credentials documented below.

> **Prefer a managed connection?** [Use Google Analytics 4 with hosted getmcpads](https://www.getmcpads.com/tools/ga4?utm_source=github&utm_medium=readme&utm_campaign=google-analytics). Connect your account, select the data your assistant may access and use the hosted MCP connection. See the site for current features and plans.

## What you get

| | |
|---|---|
| **27 read tools** | Reports, pivots, funnels, realtime, plus the Admin API: properties, data streams, custom definitions, key events, audiences |
| **Diagnostics** | Ecommerce, BigQuery export, server-side tagging, audience exports, quota snapshots |
| **51 metrics, 62 dimensions** | With a compatibility matrix that catches invalid combinations before they hit the API |
| **6 resources** | Live catalogues the model can read: metrics, dimensions, compatibility rules, 12 workflow recipes |
| **Identifier redaction** | User, email and device identifiers redacted by default on access bindings and audience exports, with explicit opt-in to see them |
| **No writes at all** | Not a flag, a property of the code. See below |

### Compatibility, checked before the call

GA4 rejects many metric and dimension combinations, and its errors rarely explain which pair
is at fault. This server carries the compatibility matrix, so `ga4_check_compatibility` and
`ga4_validate_query` let the model verify a combination before spending a call and a quota
token on it.

Quotas matter here more than on ad platforms: GA4 charges tokens per property per day, and a
few careless exploratory queries can exhaust them. `ga4_get_property_quotas_snapshot` shows
what is left.

---

## Read-only, and why it stays that way

There are no write tools, and no environment variable that adds any. Every tool calls a read
method of the Data API or the Admin API.

This is not caution for its own sake. A misread report is a wrong answer you can spot. A
mistaken write to an analytics property, a deleted audience or an edited data stream, corrupts
the record you use to judge everything else, and often silently. The other servers we publish
do have write tools, guarded by a mandatory preview. This one has none.

Our ad platform servers with guarded writes:
[Meta Ads](https://github.com/getmcpads-com/meta-ads-mcp-server) ·
[Google Ads](https://github.com/getmcpads-com/google-ads-mcp-server) ·
[TikTok Ads](https://github.com/getmcpads-com/tiktok-ads-mcp-server)

---

## Personal data

Analytics data is not anonymous by default. A GA4 property can carry a `userId` you set
yourself, a device identifier, or a Google Signals pseudonymous ID. An MCP conversation sends
whatever a tool returns to a model.

**Identifiers are redacted by default wherever this server can return them**, and showing them
is an explicit opt-in, never the default.

| Tool | Behaviour |
|---|---|
| `ga4_list_admin_resources` | Access bindings have user and email identifiers redacted |
| `ga4_query_audience_export` | Identifier columns redacted, matched against the export's own dimension metadata |
| `ga4_get_audience_export_diagnostics` | Same redaction on the row sample |

Every one of these accepts `includePersonalIdentifiers: true` to return raw values, and
defaults to `false`.

Audience export rows are positional, so the redaction reads the export's dimension metadata to
find identifier columns. **If that metadata is missing, every value in the row is redacted**
rather than guessing which column is safe. Failing closed is the point.

**Report rows are not redacted.** `ga4_run_report` and the other reporting tools return what
you asked for. Altering the numbers a report returns would be worse than returning them.

So one decision stays yours: if your property carries a `userId` you consider personal, do not
request it as a report dimension in a conversation whose transcript leaves your machine.

---

## Getting credentials

Three values, obtained once.

### 1. OAuth client

In a [Google Cloud project](https://console.cloud.google.com/), enable the **Google Analytics
Data API** and the **Google Analytics Admin API**, then create an OAuth client under
**APIs & Services → Credentials**. Choose **Desktop app** for local use. Note the **client ID**
and **client secret**.

### 2. Refresh token

Run the OAuth consent flow once, signed in as a Google account with access to your GA4
properties, and keep the **refresh token**. The `analytics.readonly` scope is enough, and it
is the only one you should grant.

📖 [Google OAuth for installed apps](https://developers.google.com/identity/protocols/oauth2/native-app)

**The refresh token does not expire.** It is the sensitive value: anyone holding it can mint
access tokens indefinitely. Use an OAuth client dedicated to this server so you can revoke it
on its own.

### 3. Property ID, optional

Set `GA4_PROPERTY_ID` to avoid passing it on every call. Find it in GA4 under
**Admin → Property Settings**, or list them with `ga4_list_properties`.

Run **`ga4_health_check`** as your first call. It verifies the credentials and lists the
properties you can actually reach, without printing any secret.

---

## Setup

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "google-analytics": {
      "command": "npx",
      "args": ["-y", "@getmcpads/google-analytics-mcp-server"],
      "env": {
        "GA4_CLIENT_ID": "your-client-id",
        "GA4_CLIENT_SECRET": "your-client-secret",
        "GA4_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

Restart Claude Desktop. Ask it: *"list my Google Analytics properties"*.

### Claude Code

```bash
claude mcp add google-analytics --env GA4_CLIENT_ID=... --env GA4_CLIENT_SECRET=... --env GA4_REFRESH_TOKEN=... -- npx -y @getmcpads/google-analytics-mcp-server
```

### Cursor

`.cursor/mcp.json` in your project, same shape as the Claude Desktop config above.

### From source

```bash
git clone https://github.com/getmcpads-com/google-analytics-mcp-server.git
cd google-analytics-mcp-server
npm install && npm run build
cp .env.example .env   # then fill in your credentials
npm start
```

### Configuration

| Variable | Default | Meaning |
|---|---|---|
| `GA4_CLIENT_ID` | none | **Required.** OAuth client ID |
| `GA4_CLIENT_SECRET` | none | **Required.** OAuth client secret |
| `GA4_REFRESH_TOKEN` | none | **Required.** From the consent flow |
| `GA4_PROPERTY_ID` | none | Optional default, saves passing it on every call |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |

Check your setup at any time:

```bash
npm run doctor
```

---

## Tools

Every tool is listed below. See [server-card.json](server-card.json) for complete parameter and output schemas.

<details>
<summary><b>27 read tools</b></summary>

| Tool | Purpose |
| --- | --- |
| `ga4_health_check` | Read-only GA4 health check. |
| `ga4_list_properties` | List all GA4 properties accessible with the current credentials. |
| `ga4_run_report` | Run a GA4 analytics report with intelligent query planning. |
| `ga4_run_realtime_report` | Run a read-only GA4 Data API realtime report. |
| `ga4_get_metadata` | Get the complete list of dimensions and metrics available for a specific GA4 property. |
| `ga4_get_custom_definitions` | List custom dimensions and custom metrics exposed by GA4 Data API metadata. |
| `ga4_get_key_events` | Inventory GA4 key events/conversions using metadata-aware Data API reports. |
| `ga4_get_ecommerce_diagnostics` | Read-only ecommerce coverage diagnostics for core ecommerce events, revenue metrics, and item-level reporting over a date range. |
| `ga4_get_event_parameters` | Best-effort event parameter inventory from GA4 metadata plus event reports. |
| `ga4_run_funnel_recipe` | Run a read-only configurable funnel recipe using one GA4 report per eventName/pagePath step and return simple step counts. |
| `ga4_get_audience_export_diagnostics` | Read-only Audience Export diagnostics. |
| `ga4_get_audience_diagnostics` | Read-only audience diagnostics from Admin API audiences, Data API recurring audience lists, and observed audienceName report fallback. |
| `ga4_get_bigquery_export_diagnostics` | Detect GA4 BigQuery export links and diagnose export modes, stream coverage, excluded events, and dataset location. |
| `ga4_get_server_side_tagging_diagnostics` | Best-effort read-only server-side tagging diagnostics from data streams, Measurement Protocol secrets, event rules, and stream settings. |
| `ga4_run_advanced_funnel_report` | Run the GA4 Data API v1alpha runFunnelReport endpoint with optional breakdown/next-action, falling back to read-only step counts if unavailable. |
| `ga4_get_channel_groups` | List custom channel groups defined for a GA4 property. |
| `ga4_validate_query` | Validate a metric/dimension combination BEFORE executing. |
| `ga4_run_pivot_report` | Run a read-only GA4 Data API pivot report with native filters, ordering, quota state, multiple date ranges, and up to 250,000 pivot cells. |
| `ga4_batch_run_reports` | Run 1-5 independent read-only GA4 Core reports for the same property in one official Data API batch request. |
| `ga4_batch_run_pivot_reports` | Run 1-5 independent read-only GA4 pivot reports for the same property in one official Data API batch request. |
| `ga4_check_compatibility` | Ask the official GA4 Data API which dimensions and metrics are compatible with a proposed Core report selection. |
| `ga4_get_property_quotas_snapshot` | Read the current GA4 Data API property quota snapshot from the official v1alpha endpoint. |
| `ga4_list_accounts` | List raw GA4 Analytics Admin accounts accessible to the authenticated user (read-only, auto-paginated). |
| `ga4_list_admin_resources` | List an allowlisted GA4 Admin collection in read-only mode: streams, custom definitions, key events, audiences, product links, annotations, channel groups, expanded datasets, subproperty/rollup configuration, and access bindings. |
| `ga4_get_property_configuration` | Read GA4 property details plus selected singleton Admin settings (attribution, retention, Google Signals, reporting identity, or user-provided-data settings). |
| `ga4_list_audience_exports` | List existing GA4 Audience Export snapshots and Recurring Audience Lists without creating new exports. |
| `ga4_query_audience_export` | Query rows from an existing GA4 Audience Export. |

</details>

<details>
<summary><b>6 resources</b></summary>

| URI | Contents |
|---|---|
| `ga4://manifest` | What this server exposes, and which tool to run first |
| `ga4://metrics` | All 51 metrics with categories and formats |
| `ga4://dimensions` | All 62 dimensions and where they are valid |
| `ga4://compatibility` | The compatibility matrix |
| `ga4://recipes` | 12 step-by-step workflows |
| `ga4://p2-diagnostics` | Diagnostic playbooks |

</details>

---

## Security

- **The client secret and refresh token are never logged**, at any log level, or written to disk.
- **Three hosts are contacted, and only three**: `analyticsdata.googleapis.com`,
  `analyticsadmin.googleapis.com` and `oauth2.googleapis.com`. *A test fails the build if a
  fourth host appears in the source.*
- **No fetch follows a redirect.** Every outbound call sets `redirect: "error"`, so a redirect
  cannot forward a bearer token or client secret to another host. *A test fails the build if
  any fetch omits this.*
- **No telemetry.** The server makes no network call other than to Google.

Full policy, including how personal data is handled: [SECURITY.md](SECURITY.md).

---

## Looking for a managed, multi-platform version?

[Try hosted GA4](https://www.getmcpads.com/tools/ga4?utm_source=github&utm_medium=readme&utm_campaign=ga4_hosted) if you want to use this source without operating a local server.
getmcpads also connects advertising, Search Console and GA4 through one MCP URL.
Source availability and plan limits are listed on the site; connecting an account is still required.

1. Follow the [GA4 connection guide](https://www.getmcpads.com/guides/sources/ga4).
2. Select the account or property your assistant may read.
3. Connect [Claude](https://www.getmcpads.com/guides/setup/claude),
   [ChatGPT](https://www.getmcpads.com/guides/setup/chatgpt) or
   [Codex](https://www.getmcpads.com/guides/setup/codex).
4. Try a read-only review: “Compare acquisition channels, landing pages and configured key events. State missing data and do not change anything.”

See the [current hosted tool catalogue](https://www.getmcpads.com/tools/ga4)
and [pricing](https://www.getmcpads.com/pricing) before choosing a paid plan.
This Apache 2.0 adapter remains independently useful with your own credentials.

---

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).
Please read [SECURITY.md](SECURITY.md) before reporting anything security-related.

## Licence

[Apache License 2.0](LICENSE). See also [NOTICE](NOTICE).

Google, Google Analytics and GA4 are trademarks of Google LLC.
**This project is not affiliated with, endorsed by, or sponsored by Google LLC.**
It is an independent client of a public API.

## MCP contracts and desktop bundle

Every tool declares read/write annotations, parameter descriptions and a structured output schema. Successful calls expose the payload as `structuredContent.result`; errors retain `isError: true`. The generated [server card](server-card.json) contains definitions only.

Run `npm run bundle -- /path/to/output` to build a `.mcpb` desktop bundle from the current catalog. Credentials are entered locally during installation. This server remains read-only.

## More from getmcpads

[Meta Ads](https://github.com/getmcpads-com/meta-ads-mcp-server) · [Google Ads](https://github.com/getmcpads-com/google-ads-mcp-server) · [Google Search Console](https://github.com/getmcpads-com/google-search-console-mcp-server) · [TikTok Ads](https://github.com/getmcpads-com/tiktok-ads-mcp-server) · [Pinterest Ads](https://github.com/getmcpads-com/pinterest-ads-mcp-server) · [X Ads](https://github.com/getmcpads-com/x-ads-mcp-server)

Maintained by **Emmanuel** at [getmcpads](https://www.getmcpads.com). Questions: [hello@getmcpads.com](mailto:hello@getmcpads.com).
