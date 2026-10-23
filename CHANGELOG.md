# Changelog

## 2.1.0 - 2026-10-23

- Add the optional `GA4_PROPERTY_IDS` allowlist, checked before every request. `ga4_list_properties`, `ga4_list_accounts` and `ga4_health_check` list only the allowed properties and the accounts that hold them. Unset, the server prints a recommendation on stderr. It becomes required in 3.0.0.
- Refuse a `GA4_PROPERTY_ID` outside `GA4_PROPERTY_IDS` at startup, when both are set.
- Port the gateway's handling of a refused refresh token (`invalid_grant`, `admin_policy_enforced`): one re-authorization message naming `GA4_REFRESH_TOKEN`, and no further token requests until restart.
- Give the token request a deadline and bound every response body.
- Require Node.js `^22.23.4 || ^24.22.1 || >=26.12.1`, warn on stderr at startup and in `npm run doctor` on older releases, and test Node 22, 24 and 26 in CI.
- Update `@modelcontextprotocol/sdk` to 1.32.1 and regenerate the lockfile.
- Publish from version tags with `release.yml`, which replaces `publish-mcp.yml`. Add Dependabot.
- No tool is added or removed: 27 read tools, no write tools.

## 2.0.1 - 2026-09-23

- Restore public source hosting under the get-mcp-ads GitHub organization.
- Update repository and support links while preserving npm package and MCP registry names.
- No changes to platform tools or credential requirements.

## 2.0.0 - 2026-09-20

- Confirm the current native 27-tool read catalog against the hosted implementation.
- Retain standalone OAuth and redirect protections; no hosted account-selection or application database dependency is introduced.
- Require Node.js 22.12 or newer and check Node 22/24 in CI.
- Update vulnerable dependencies and regenerate the MCP catalog.
- No hosted creative UI or MCP Apps integrations.


## 1.1.0

- Synchronize applicable platform features with GetMCPAds commit b1471be while retaining local read-only exploration tools and credential configuration.
- Expose 27 read tools.
- Add MCP annotations, parameter descriptions, structured results, server identity and an offline-generated discovery card.
- Preserve preview/confirmation boundaries; test provider request construction and errors with mocked APIs.
- Refuse credential-bearing redirects and document provider-specific limitations.

No live advertiser mutation is performed by the release tests.
