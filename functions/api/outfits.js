const CONFIG_SCHEMA = `
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`;

const CONFIG_KEY = "outfits";

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

async function ensureDb(env) {
  if (!env || !env.DB) {
    throw new Error("D1 binding DB is missing.");
  }
  await env.DB.prepare(CONFIG_SCHEMA).run();
  return env.DB;
}

function adminError(request, env) {
  if (!env.ADMIN_KEY) return null;
  const key = request.headers.get("x-admin-key") || new URL(request.url).searchParams.get("key") || "";
  if (key === env.ADMIN_KEY) return null;
  return json({ ok: false, error: "Admin key missing or invalid" }, { status: 401 });
}

function normalizeOutfit(item, index) {
  const id = String(item && item.id != null ? item.id : index).trim().padStart(2, "0").slice(0, 12);
  return {
    active: item && item.active === false ? false : true,
    id,
    file: String(item && item.file ? item.file : "").trim(),
    name: String(item && item.name ? item.name : `Outfit ${index + 1}`).trim().slice(0, 120),
    group: String(item && item.group ? item.group : "Sonstige").trim().slice(0, 60),
    note: String(item && item.note ? item.note : "").trim().slice(0, 300)
  };
}

function normalizeOutfits(value) {
  if (!Array.isArray(value)) {
    throw new Error("outfits must be an array");
  }
  if (value.length > 250) {
    throw new Error("too many outfits");
  }
  const ids = new Set();
  return value.map(normalizeOutfit).filter(item => {
    if (!item.file || ids.has(item.id)) return false;
    ids.add(item.id);
    return true;
  });
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ env }) {
  try {
    const db = await ensureDb(env);
    const row = await db.prepare(
      "SELECT data_json, updated_at FROM app_config WHERE key = ?"
    ).bind(CONFIG_KEY).first();

    return json({
      ok: true,
      outfits: row ? parseJson(row.data_json, []) : null,
      updatedAt: row ? row.updated_at : null
    });
  } catch (error) {
    return json({ ok: false, error: error.message || String(error), outfits: null }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = adminError(request, env);
  if (auth) return auth;

  try {
    const db = await ensureDb(env);
    const body = await request.json();
    const outfits = normalizeOutfits(body.outfits);
    const dataJson = JSON.stringify(outfits);
    if (dataJson.length > 350000) {
      return json({ ok: false, error: "outfit config is too large" }, { status: 413 });
    }

    await db.prepare(`
      INSERT INTO app_config (key, data_json, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key)
      DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP
    `).bind(CONFIG_KEY, dataJson).run();

    return json({ ok: true, outfits, count: outfits.length });
  } catch (error) {
    return json({ ok: false, error: error.message || String(error) }, { status: 400 });
  }
}
