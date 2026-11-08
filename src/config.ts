/**
 * google-analytics-mcp-server: an open-source MCP server for Google Analytics 4.
 * Copyright 2026 GetMCPAds. https://www.getmcpads.com
 * SPDX-License-Identifier: Apache-2.0
 */
import { z } from "zod";
import { logger } from "./core/logger.js";
import { PROPERTY_IDS_ENV, parsePropertyIds, propertyIsAllowed } from "./core/account-scope.js";
const configSchema = z.object({
  clientId: z.string().min(1, "GA4_CLIENT_ID is required"),
  clientSecret: z.string().min(1, "GA4_CLIENT_SECRET is required"),
  refreshToken: z.string().min(1, "GA4_REFRESH_TOKEN is required"),
  defaultPropertyId: z.string().optional(),
  /** Property IDs every tool is limited to. Undefined: every property the credentials reach. */
  allowedPropertyIds: z.array(z.string()).optional(),
  logLevel: z.enum(["debug", "info", "warn", "error"]).prefault("info"),
});
export type GA4Config = z.infer<typeof configSchema>;
export function loadConfig(): GA4Config {
  const raw = {
    clientId: process.env["GA4_CLIENT_ID"] ?? "",
    clientSecret: process.env["GA4_CLIENT_SECRET"] ?? "",
    refreshToken: process.env["GA4_REFRESH_TOKEN"] ?? "",
    defaultPropertyId: process.env["GA4_PROPERTY_ID"] || process.env["GA4_DEFAULT_PROPERTY_ID"] || undefined,
    allowedPropertyIds: parsePropertyIds(process.env[PROPERTY_IDS_ENV]),
    logLevel: process.env["LOG_LEVEL"] ?? "info",
  };
  const result = configSchema.safeParse(raw);
  if (!result.success) {
    const missing = result.error.issues.map(i => i.message).join(", ");
    logger.error("config", `Missing credentials: ${missing}`);
    throw new Error(`Missing GA4 credentials: ${missing}`);
  }
  // Both variables are new or explicit together, so refusing a mismatch breaks no existing setup.
  if (result.data.defaultPropertyId && !propertyIsAllowed(result.data.allowedPropertyIds, result.data.defaultPropertyId)) {
    throw new Error(`GA4_PROPERTY_ID must be one of the properties listed in ${PROPERTY_IDS_ENV}.`);
  }
  logger.system("GA4 MCP Server configured");
  return result.data;
}

/**
 * Lines the CLI writes to stderr at startup, never to stdout, which carries the
 * MCP protocol. Nothing here changes what the server does.
 */
export function startupNotices(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env[PROPERTY_IDS_ENV]?.trim()) return [];
  return [
    `${PROPERTY_IDS_ENV} is not set, so every property these credentials reach is available. ` +
      "List the property IDs this server may use. The variable becomes required in 3.0.0.",
  ];
}
