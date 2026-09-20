# Source synchronization

Reviewed on 2026-09-20 against getmcpads source revision `41cc1ca`.

- Confirm the current native 27-tool read catalog against the hosted implementation.
- Retain standalone OAuth and redirect protections; no hosted account-selection or application database dependency is introduced.

The public server remains self-contained. Hosted billing, workspaces, account-selection storage, creative galleries, Launcher files and MCP Apps UI are outside this synchronization. Existing standalone protections and public features newer than the hosted source are retained.

Validation uses synthetic data. No live advertising write is required by the test suite. The generated server-card.json is the source of truth for this revision's tool schemas.

Maintainer: Emmanuel, getmcpads. Contact: hello@getmcpads.com.
