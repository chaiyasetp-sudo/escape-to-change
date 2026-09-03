import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const STORE_NAME = "escape-to-change-results";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, private",
      "x-content-type-options": "nosniff",
    },
  });
}

function authorized(req) {
  const expected = process.env.ETC_ADMIN_TOKEN || "";
  if (!expected) return false;
  const header = req.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

function safeKey(value) {
  const v = String(value || "").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
  return v || null;
}

export default async (req) => {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  if (!process.env.ETC_ADMIN_TOKEN) return json({ error: "Teacher dashboard is not configured" }, 503);
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);

  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const url = new URL(req.url);
  const id = safeKey(url.searchParams.get("id"));

  if (id) {
    const record = await store.get(id, { type: "json", consistency: "strong" });
    if (!record) return json({ error: "Result not found" }, 404);
    return json({ record });
  }

  const { blobs } = await store.list();
  const records = await Promise.all(
    blobs.map(async ({ key }) => {
      try {
        const r = await store.get(key, { type: "json", consistency: "strong" });
        if (!r) return null;
        return {
          ...(r.summary || {}),
          submittedAt: r.submittedAt || null,
        };
      } catch {
        return null;
      }
    })
  );

  const results = records
    .filter(Boolean)
    .sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));

  return json({ count: results.length, results });
};
