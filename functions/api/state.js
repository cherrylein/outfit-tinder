const STORE_SCHEMA = `
CREATE TABLE IF NOT EXISTS review_states (
  project TEXT NOT NULL,
  user_name TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project, user_name)
);
`;

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

function cleanProject(value) {
  return String(value || "default")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "default";
}

function cleanUserName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60);
}

async function ensureDb(env) {
  if (!env.DB) {
    return false;
  }
  await env.DB.exec(STORE_SCHEMA);
  return true;
}

export async function onRequestGet({ request, env }) {
  if (!(await ensureDb(env))) {
    return json({ ok: false, error: "D1 binding DB is missing" }, { status: 503 });
  }

  const url = new URL(request.url);
  const project = cleanProject(url.searchParams.get("project"));
  const userName = cleanUserName(url.searchParams.get("user"));

  if (userName) {
    const row = await env.DB.prepare(
      "SELECT project, user_name, data_json, updated_at FROM review_states WHERE project = ? AND user_name = ?"
    ).bind(project, userName).first();

    return json({
      ok: true,
      project,
      userName,
      state: row ? JSON.parse(row.data_json || "{}") : {},
      updatedAt: row ? row.updated_at : null
    });
  }

  const result = await env.DB.prepare(
    "SELECT project, user_name, data_json, updated_at FROM review_states WHERE project = ? ORDER BY lower(user_name) ASC"
  ).bind(project).all();

  return json({
    ok: true,
    project,
    participants: (result.results || []).map(row => ({
      userName: row.user_name,
      state: JSON.parse(row.data_json || "{}"),
      updatedAt: row.updated_at
    }))
  });
}

export async function onRequestPost({ request, env }) {
  if (!(await ensureDb(env))) {
    return json({ ok: false, error: "D1 binding DB is missing" }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const project = cleanProject(body.project);
  const userName = cleanUserName(body.userName);
  const state = body.state && typeof body.state === "object" ? body.state : {};

  if (!userName) {
    return json({ ok: false, error: "Missing userName" }, { status: 400 });
  }

  const dataJson = JSON.stringify(state);
  if (dataJson.length > 250000) {
    return json({ ok: false, error: "State is too large" }, { status: 413 });
  }

  await env.DB.prepare(`
    INSERT INTO review_states (project, user_name, data_json, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(project, user_name)
    DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP
  `).bind(project, userName, dataJson).run();

  return json({ ok: true, project, userName });
}
