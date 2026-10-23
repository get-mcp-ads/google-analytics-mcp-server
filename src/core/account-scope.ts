/**
 * google-analytics-mcp-server: an open-source MCP server for Google Analytics 4.
 * Copyright 2026 GetMCPAds. https://www.getmcpads.com
 * SPDX-License-Identifier: Apache-2.0
 */

export const PROPERTY_IDS_ENV = "GA4_PROPERTY_IDS";

/** Property IDs as numbers in a string, without the `properties/` prefix. */
export function normalizePropertyId(value: string): string {
  return String(value).trim().replace(/^properties\//, "");
}

/**
 * Parse GA4_PROPERTY_IDS. Unset or blank means no allowlist. A value that is
 * set but malformed is an error: silently ignoring it would widen access.
 */
export function parsePropertyIds(raw: string | undefined): string[] | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  const ids = [...new Set(raw.split(",").map(normalizePropertyId).filter(Boolean))];
  if (ids.length === 0 || ids.length > 200 || ids.some(id => !/^\d{1,20}$/.test(id))) {
    throw new Error(`${PROPERTY_IDS_ENV} must list 1 to 200 numeric GA4 property IDs, separated by commas.`);
  }
  return ids;
}

/** Undefined allowlist: every property the credentials reach. */
export function propertyIsAllowed(allowed: readonly string[] | undefined, id: string): boolean {
  return allowed === undefined || allowed.includes(normalizePropertyId(id));
}

export class PropertyNotAllowedError extends Error {
  readonly code = 403;
  readonly status = "PROPERTY_NOT_ALLOWED";
  readonly suggestion = `Add the property ID to ${PROPERTY_IDS_ENV} and restart the server, or use a property it already lists.`;
  constructor(id: string) {
    super(`Property ${normalizePropertyId(id)} is not in ${PROPERTY_IDS_ENV}. Nothing was sent to Google.`);
    this.name = "PropertyNotAllowedError";
  }
}

export function assertPropertyAllowed(allowed: readonly string[] | undefined, id: string): void {
  if (!propertyIsAllowed(allowed, id)) throw new PropertyNotAllowedError(id);
}

/**
 * Check the property a GA4 URL or resource name addresses, before credentials
 * are attached. Account listings name no property and pass.
 */
export function assertResourceAllowed(allowed: readonly string[] | undefined, urlOrName: string): void {
  if (allowed === undefined) return;
  const path = /^https:\/\//.test(urlOrName) ? new URL(urlOrName).pathname : urlOrName;
  const property = path.match(/(?:^|\/)properties\/([^/:?]+)/)?.[1];
  if (property !== undefined) assertPropertyAllowed(allowed, decodeURIComponent(property));
}
