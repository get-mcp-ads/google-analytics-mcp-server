# Source synchronization

Reviewed on 2026-10-23 against getmcpads source revision `3e1c2c8`. The previous review used `41cc1ca`.

## Synchronized

- The handling of a refused refresh token (commit `210e1f6`, the only change to the gateway's GA4 source since `41cc1ca`). The gateway marks the connection expired and asks the person to reconnect. This server has no stored connection, so it remembers the refusal for the life of the process, answers every later call with one re-authorization message naming `GA4_REFRESH_TOKEN`, and sends no further token request. As in the gateway, only `invalid_grant` and `admin_policy_enforced` are treated as final. `invalid_client` and `unauthorized_client` stay ordinary errors.

## Reviewed and not synchronized

- Commit `210e1f6` also adds a second OAuth client per connection and its storage. Both are hosted connection management. This server uses the one client given in `GA4_CLIENT_ID`.

## Differences from the gateway

- **Property allowlist.** The gateway receives the selected properties from its database. This server reads them from the optional `GA4_PROPERTY_IDS`.
- **Tool catalog.** The 27 read tools match the gateway's GA4 inventory at `3e1c2c8`. No write tool exists here or in the gateway.

The public server remains self-contained. Hosted billing, workspaces, account-selection storage, creative galleries, alerts, Google Sheets exports, client memory, Launcher files and MCP Apps UI are outside this synchronization. Existing standalone protections, including the redaction of personal identifiers, are retained.

Validation uses synthetic data and a mocked `fetch`. The generated server-card.json is the source of truth for this revision's tool schemas.

Maintainer: Emmanuel, getmcpads. Contact: hello@getmcpads.com.
