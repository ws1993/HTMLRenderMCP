import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { getLiveSession, listLiveSessions, sanitizeSessionId } from "./liveStore.js";
import { renderHtmlPage } from "../renderers/renderHtml.js";

const HOST = "127.0.0.1";
const configuredPort = Number.parseInt(process.env.HTML_RENDER_MCP_PREVIEW_PORT ?? "3766", 10);
const PORT = Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : 3766;

interface PreviewServerInfo {
  host: string;
  port: number;
  baseUrl: string;
}

const clients = new Map<string, Set<ServerResponse>>();
let previewServer: Server | undefined;
let startPromise: Promise<PreviewServerInfo> | undefined;

export function getPreviewUrl(sessionId: string): string {
  return `${getBaseUrl()}/preview/${encodeURIComponent(sanitizeSessionId(sessionId))}`;
}

export function getEventUrl(sessionId: string): string {
  return `${getBaseUrl()}/events/${encodeURIComponent(sanitizeSessionId(sessionId))}`;
}

export function getBaseUrl(): string {
  return `http://${HOST}:${PORT}`;
}

export async function ensurePreviewServer(): Promise<PreviewServerInfo> {
  if (previewServer?.listening) {
    return getServerInfo();
  }

  if (startPromise) {
    return startPromise;
  }

  startPromise = new Promise((resolve, reject) => {
    const server = createServer(handleRequest);

    server.once("error", (error) => {
      if (!previewServer) {
        startPromise = undefined;
      }

      reject(error);
    });

    server.listen(PORT, HOST, () => {
      previewServer = server;
      server.unref();
      resolve(getServerInfo());
    });
  });

  return startPromise;
}

export function notifyLiveSession(sessionId: string): void {
  const safeSessionId = sanitizeSessionId(sessionId);
  const session = getLiveSession(safeSessionId);
  const sessionClients = clients.get(safeSessionId);

  if (!sessionClients?.size) {
    return;
  }

  const payload = JSON.stringify({
    sessionId: safeSessionId,
    version: session?.version ?? 0,
    updatedAt: session?.updatedAt ?? new Date().toISOString()
  });

  for (const response of sessionClients) {
    try {
      response.write(`event: refresh\ndata: ${payload}\n\n`);
    } catch {
      sessionClients.delete(response);
    }
  }
}

function getServerInfo(): PreviewServerInfo {
  return {
    host: HOST,
    port: PORT,
    baseUrl: getBaseUrl()
  };
}

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    if (request.method !== "GET") {
      sendText(response, 405, "Method Not Allowed");
      return;
    }

    const requestUrl = new URL(request.url ?? "/", getBaseUrl());
    const [route, rawSessionId] = requestUrl.pathname.split("/").filter(Boolean);

    if (!route) {
      sendHtml(response, 200, renderIndexPage());
      return;
    }

    if (route === "health") {
      sendJson(response, 200, { ok: true, ...getServerInfo() });
      return;
    }

    if (route === "sessions") {
      sendJson(
        response,
        200,
        listLiveSessions().map((session) => ({
          sessionId: session.sessionId,
          title: session.page.title,
          template: session.page.template,
          theme: session.page.theme,
          sections: session.page.sections.length,
          version: session.version,
          updatedAt: session.updatedAt,
          previewUrl: getPreviewUrl(session.sessionId)
        }))
      );
      return;
    }

    if (!rawSessionId) {
      sendText(response, 400, "sessionId is required");
      return;
    }

    const sessionId = sanitizeSessionId(decodeURIComponent(rawSessionId));

    if (route === "preview") {
      const html = await renderLivePreview(sessionId);
      sendHtml(response, getLiveSession(sessionId) ? 200 : 404, html);
      return;
    }

    if (route === "snapshot") {
      const session = getLiveSession(sessionId);

      if (!session) {
        sendHtml(response, 404, renderMissingSessionPage(sessionId));
        return;
      }

      sendHtml(response, 200, await renderHtmlPage(session.page));
      return;
    }

    if (route === "events") {
      handleEvents(request, response, sessionId);
      return;
    }

    sendText(response, 404, "Not Found");
  } catch (error) {
    sendText(response, 500, error instanceof Error ? error.message : String(error));
  }
}

async function renderLivePreview(sessionId: string): Promise<string> {
  const session = getLiveSession(sessionId);

  if (!session) {
    return renderMissingSessionPage(sessionId);
  }

  const html = await renderHtmlPage(session.page);
  return injectLiveReload(html, session.sessionId);
}

function injectLiveReload(html: string, sessionId: string): string {
  const eventsPath = `/events/${encodeURIComponent(sessionId)}`;
  const script = `
    <style id="html-render-mcp-live-style">
      .html-render-mcp-live-badge {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483647;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.88);
        color: #fff;
        font: 12px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.24);
        pointer-events: none;
      }
    </style>
    <div class="html-render-mcp-live-badge">HTML Render MCP Live</div>
    <script>
      (() => {
        const source = new EventSource(${JSON.stringify(eventsPath)});
        source.addEventListener("refresh", () => window.location.reload());
      })();
    </script>
  `;

  return html.includes("</body>") ? html.replace("</body>", `${script}\n</body>`) : `${html}\n${script}`;
}

function handleEvents(
  request: IncomingMessage,
  response: ServerResponse,
  sessionId: string
): void {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });

  const sessionClients = clients.get(sessionId) ?? new Set<ServerResponse>();
  sessionClients.add(response);
  clients.set(sessionId, sessionClients);

  const session = getLiveSession(sessionId);
  response.write(
    `event: connected\ndata: ${JSON.stringify({
      sessionId,
      version: session?.version ?? 0,
      updatedAt: session?.updatedAt ?? null
    })}\n\n`
  );

  request.on("close", () => {
    sessionClients.delete(response);

    if (sessionClients.size === 0) {
      clients.delete(sessionId);
    }
  });
}

function renderIndexPage(): string {
  const sessions = listLiveSessions();
  const links = sessions
    .map(
      (session) =>
        `<li><a href="/preview/${encodeURIComponent(session.sessionId)}">${escapeText(
          session.sessionId
        )}</a> - ${escapeText(session.page.title)} (${session.page.sections.length} sections)</li>`
    )
    .join("");

  return `<!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>HTML Render MCP Live Sessions</title>
      </head>
      <body>
        <h1>HTML Render MCP Live Sessions</h1>
        ${links ? `<ul>${links}</ul>` : "<p>No live sessions yet.</p>"}
      </body>
    </html>`;
}

function renderMissingSessionPage(sessionId: string): string {
  return `<!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Live session not found</title>
      </head>
      <body>
        <h1>Live session not found</h1>
        <p>Session <code>${escapeText(sessionId)}</code> does not exist.</p>
      </body>
    </html>`;
}

function sendHtml(response: ServerResponse, statusCode: number, html: string): void {
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(html);
}

function sendJson(response: ServerResponse, statusCode: number, value: unknown): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(value, null, 2));
}

function sendText(response: ServerResponse, statusCode: number, text: string): void {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(text);
}

function escapeText(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
