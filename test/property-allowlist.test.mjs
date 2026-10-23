/**
 * GA4_PROPERTY_IDS limits every tool to the listed properties.
 *
 * The check runs before any request, and discovery lists only the allowed
 * properties and the accounts that hold them.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { parsePropertyIds, assertResourceAllowed } from "../src/core/account-scope.ts";
import { startupNotices } from "../src/config.ts";
import { createServer } from "../src/server.ts";
import { GA4Client } from "../src/platforms/ga4/client.ts";

function stubFetch(handler) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(String(url));
    return handler(String(url), init);
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

async function connect(config, callback) {
  const server = createServer({ clientId: "id", clientSecret: "secret", refreshToken: "refresh", logLevel: "error", ...config });
  const client = new Client({ name: "allowlist-test", version: "1" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    await callback(client);
  } finally {
    await client.close();
    await server.close();
  }
}

test("the variable accepts numeric IDs with or without the properties/ prefix", () => {
  assert.equal(parsePropertyIds(undefined), undefined);
  assert.equal(parsePropertyIds(""), undefined);
  assert.deepEqual(parsePropertyIds("properties/123, 456,123"), ["123", "456"]);
  assert.throws(() => parsePropertyIds("G-ABC123"), /GA4_PROPERTY_IDS/);
});

test("startup recommends the allowlist only while it is unset", () => {
  assert.match(startupNotices({}).join("\n"), /GA4_PROPERTY_IDS is not set[\s\S]*required in 3\.0\.0/);
  assert.deepEqual(startupNotices({ GA4_PROPERTY_IDS: "123" }), []);
});

test("URLs and resource names of another property are refused", () => {
  assert.throws(() => assertResourceAllowed(["123"], "https://analyticsdata.googleapis.com/v1beta/properties/999:runReport"), /not in GA4_PROPERTY_IDS/);
  assert.throws(() => assertResourceAllowed(["123"], "properties/999/audienceExports/1"), /not in GA4_PROPERTY_IDS/);
  assertResourceAllowed(["123"], "https://analyticsdata.googleapis.com/v1beta/properties/123:runReport");
  assertResourceAllowed(["123"], "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200");
  assertResourceAllowed(undefined, "https://analyticsdata.googleapis.com/v1beta/properties/999:runReport");
});

test("a tool naming another property fails before any request", async () => {
  const stub = stubFetch((url) => { throw new Error(`unexpected request ${url}`); });
  try {
    await connect({ allowedPropertyIds: ["123"] }, async (client) => {
      for (const [name, args] of [
        ["ga4_get_metadata", { propertyId: "999" }],
        ["ga4_run_report", { propertyId: "properties/999", metrics: ["sessions"], startDate: "2026-09-01", endDate: "2026-09-30" }],
        ["ga4_query_audience_export", { audienceExportName: "properties/999/audienceExports/7" }],
      ]) {
        const result = await client.callTool({ name, arguments: args });
        assert.equal(result.isError, true, name);
        assert.match(result.content[0].text, /not in GA4_PROPERTY_IDS/, name);
      }
    });
    assert.equal(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

test("the client refuses another property even when called directly", async () => {
  const stub = stubFetch(() => json({ access_token: "access", expires_in: 3600 }));
  try {
    const client = new GA4Client({ clientId: "id", clientSecret: "secret", refreshToken: "refresh", allowedPropertyIds: ["123"] });
    await assert.rejects(client.getMetadata("999"), /not in GA4_PROPERTY_IDS/);
    assert.equal(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

test("discovery lists the allowed properties and the accounts that hold them", async () => {
  const summaries = {
    accountSummaries: [
      { account: "accounts/1", propertySummaries: [{ property: "properties/123", displayName: "Shop", propertyType: "PROPERTY_TYPE_ORDINARY" }] },
      { account: "accounts/2", propertySummaries: [{ property: "properties/999", displayName: "Other", propertyType: "PROPERTY_TYPE_ORDINARY" }] },
    ],
  };
  const stub = stubFetch((url) => {
    if (url.includes("oauth2")) return json({ access_token: "access", expires_in: 3600 });
    if (url.includes("/accountSummaries")) return json(summaries);
    if (url.includes("/v1beta/accounts")) return json({ accounts: [{ name: "accounts/1" }, { name: "accounts/2" }] });
    if (url.endsWith("/properties/123")) return json({ currencyCode: "EUR", timeZone: "Europe/Paris" });
    throw new Error(`unexpected request ${url}`);
  });
  try {
    await connect({ allowedPropertyIds: ["123"] }, async (client) => {
      const properties = JSON.parse((await client.callTool({ name: "ga4_list_properties", arguments: {} })).content[0].text);
      assert.deepEqual(JSON.stringify(properties).match(/"propertyId":"(\d+)"/g), ['"propertyId":"123"']);
      const accounts = JSON.parse((await client.callTool({ name: "ga4_list_accounts", arguments: {} })).content[0].text);
      assert.deepEqual(accounts.accounts.map((account) => account.name), ["accounts/1"]);
    });
    assert.ok(stub.calls.every((url) => !url.includes("properties/999")));
  } finally {
    stub.restore();
  }
});
