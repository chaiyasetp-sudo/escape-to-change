import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const STORE_NAME = "escape-to-change-results";
const MAX_BODY_BYTES = 1_500_000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function safeKey(value) {
  const v = String(value || "").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
  return v || null;
}

function sameOriginAllowed(req) {
  const origin = req.headers.get("origin");
  const site = process.env.URL;
  if (!origin || !site) return true;
  try {
    return new URL(origin).origin === new URL(site).origin;
  } catch {
    return false;
  }
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!sameOriginAllowed(req)) return json({ error: "Origin not allowed" }, 403);

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return json({ error: "Submission too large" }, 413);

  let payload;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return json({ error: "Submission too large" }, 413);
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!payload || payload.schema !== "ETC_RESULT_V1" || !payload.summary || !payload.state) {
    return json({ error: "Invalid ESCAPE TO CHANGE result payload" }, 400);
  }

  const key = safeKey(payload.summary.resultId);
  if (!key || key !== safeKey(payload.state.rid)) {
    return json({ error: "Missing or inconsistent Result ID" }, 400);
  }

  const mode = payload.summary.mode === "research" ? "research" : "classroom";
  const record = deepClone(payload);
  const submittedAt = new Date().toISOString();

  // Research Mode: do not persist direct student name or Student ID.
  if (mode === "research") {
    const salt = process.env.ETC_RESEARCH_SALT;
    if (!salt) return json({ error: "Research Mode is not configured on the server" }, 503);

    const rawId = String(record.summary.studentId || record.state?.p?.id || "");
    const participantId = "ETC-R-" + createHash("sha256")
      .update(`${salt}|${rawId}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();

    record.summary.participantId = participantId;
    record.summary.studentName = "";
    record.summary.studentId = "";
    if (record.state?.p) {
      record.state.p.name = "";
      record.state.p.id = participantId;
    }
  }

  record.summary.mode = mode;
  record.submittedAt = submittedAt;
  record.server = {
    schema: "ETC_SERVER_RECORD_V1",
    country: context?.geo?.country?.name || null,
  };

  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  await store.setJSON(key, record, {
    metadata: {
      mode,
      submittedAt,
      resultId: key,
    },
  });

  return json({ ok: true, key, submittedAt });
};
