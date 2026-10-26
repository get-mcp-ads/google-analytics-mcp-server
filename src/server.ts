import { installToolQuality } from "./tool-quality.js";
/**
 * google-analytics-mcp-server: an open-source MCP server for Google Analytics 4.
 * Copyright 2026 GetMCPAds. https://www.getmcpads.com
 * SPDX-License-Identifier: Apache-2.0
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GA4Config } from "./config.js";
import { registerGA4 } from "./platforms/ga4/index.js";
import { logger } from "./core/logger.js";
import { assertPropertyAllowed, assertResourceAllowed } from "./core/account-scope.js";
import { formatMcpToolError } from "./core/errors.js";

export const PACKAGE_VERSION = "2.1.1";

/**
 * Refuse a property outside GA4_PROPERTY_IDS before the tool runs. Tools name a
 * property through `propertyId` or through a resource name such as an audience
 * export. The client checks each request URL again.
 */
function installPropertyScope(server: McpServer, allowed: readonly string[] | undefined): void {
  if (allowed === undefined) return;
  const register = server.tool.bind(server) as (...args: unknown[]) => unknown;
  server.tool = ((name: string, description: string, schema: unknown, handler: (...args: unknown[]) => unknown) =>
    register(name, description, schema, async (...args: unknown[]) => {
      const input = (args[0] ?? {}) as Record<string, unknown>;
      try {
        if (typeof input["propertyId"] === "string" && input["propertyId"]) assertPropertyAllowed(allowed, input["propertyId"]);
        for (const value of Object.values(input)) {
          if (typeof value === "string" && value.startsWith("properties/")) assertResourceAllowed(allowed, value);
        }
      } catch (error) {
        return formatMcpToolError(error);
      }
      return handler(...args);
    })) as unknown as typeof server.tool;
}

export function createServer(config: GA4Config): McpServer {
  const server = new McpServer(
    { name: "google-analytics-mcp", version: PACKAGE_VERSION, title: "Google Analytics 4", websiteUrl: "https://www.getmcpads.com/tools/ga4", icons: [{ src: "https://mcp.getmcpads.com/icon.svg", mimeType: "image/svg+xml" }] },
    { capabilities: { tools: { listChanged: true }, resources: { subscribe: false, listChanged: true } } },
  );
  installToolQuality(server);
  installPropertyScope(server, config.allowedPropertyIds);
  registerGA4(server, config);
  logger.system(
    `google-analytics-mcp v${PACKAGE_VERSION} ready, read-only` +
      (config.allowedPropertyIds ? `, limited to ${config.allowedPropertyIds.length} propert${config.allowedPropertyIds.length === 1 ? "y" : "ies"}` : ""),
  );
  return server;
}
