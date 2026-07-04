export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    return response;
  }

  const html = await response.text();
  const scriptTag = '<script src="/sync.js" defer></script>';
  const bodyClose = "</body>";
  const injected = html.includes(scriptTag)
    ? html
    : html.replace(bodyClose, `  ${scriptTag}\n${bodyClose}`);

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.delete("content-length");

  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
