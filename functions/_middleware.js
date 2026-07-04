export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    return response;
  }

  const html = await response.text();
  const headClose = "</head>";
  const bodyClose = "</body>";
  const mobileCssTag = '<link rel="stylesheet" href="/mobile.css">';
  const syncScriptTag = '<script src="/sync.js" defer></script>';
  const enhancementsScriptTag = '<script src="/app-enhancements.js" defer></script>';

  let injected = html;
  if (!injected.includes(mobileCssTag)) {
    injected = injected.replace(headClose, `  ${mobileCssTag}\n${headClose}`);
  }
  if (!injected.includes(syncScriptTag)) {
    injected = injected.replace(bodyClose, `  ${syncScriptTag}\n${bodyClose}`);
  }
  if (!injected.includes(enhancementsScriptTag)) {
    injected = injected.replace(bodyClose, `  ${enhancementsScriptTag}\n${bodyClose}`);
  }

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.delete("content-length");

  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
