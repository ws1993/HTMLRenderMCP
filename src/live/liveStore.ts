import type { HtmlPageInput, HtmlSectionInput } from "../schemas/htmlPageSchema.js";

export interface LiveSession {
  sessionId: string;
  page: HtmlPageInput;
  createdAt: string;
  updatedAt: string;
  version: number;
}

const sessions = new Map<string, LiveSession>();

function now(): string {
  return new Date().toISOString();
}

export function sanitizeSessionId(sessionId: string): string {
  const normalized = sessionId.trim();

  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(normalized)) {
    throw new Error("sessionId must be 1-80 chars and contain only letters, numbers, '_' or '-'");
  }

  return normalized;
}

export function listLiveSessions(): LiveSession[] {
  return [...sessions.values()].sort((a, b) => a.sessionId.localeCompare(b.sessionId));
}

export function getLiveSession(sessionId: string): LiveSession | undefined {
  return sessions.get(sanitizeSessionId(sessionId));
}

export function requireLiveSession(sessionId: string): LiveSession {
  const session = getLiveSession(sessionId);

  if (!session) {
    throw new Error(`Live render session not found: ${sessionId}`);
  }

  return session;
}

export function startLiveSession(sessionId: string, page: HtmlPageInput): LiveSession {
  const safeSessionId = sanitizeSessionId(sessionId);
  const timestamp = now();
  const session: LiveSession = {
    sessionId: safeSessionId,
    page: {
      ...page,
      sections: page.sections ?? []
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1
  };

  sessions.set(safeSessionId, session);

  return session;
}

export function updateLiveSessionMeta(
  sessionId: string,
  patch: Partial<Omit<HtmlPageInput, "sections">>
): LiveSession {
  const session = requireLiveSession(sessionId);

  session.page = {
    ...session.page,
    ...patch
  };
  session.updatedAt = now();
  session.version += 1;

  return session;
}

export function appendLiveSection(sessionId: string, section: HtmlSectionInput): LiveSession {
  const session = requireLiveSession(sessionId);

  session.page.sections.push(section);
  session.updatedAt = now();
  session.version += 1;

  return session;
}

export function replaceLiveSection(
  sessionId: string,
  index: number,
  section: HtmlSectionInput
): LiveSession {
  const session = requireLiveSession(sessionId);

  if (!Number.isInteger(index) || index < 0 || index >= session.page.sections.length) {
    throw new Error(`section index out of range: ${index}`);
  }

  session.page.sections[index] = section;
  session.updatedAt = now();
  session.version += 1;

  return session;
}

export function removeLiveSection(sessionId: string, index: number): LiveSession {
  const session = requireLiveSession(sessionId);

  if (!Number.isInteger(index) || index < 0 || index >= session.page.sections.length) {
    throw new Error(`section index out of range: ${index}`);
  }

  session.page.sections.splice(index, 1);
  session.updatedAt = now();
  session.version += 1;

  return session;
}

export function clearLiveSession(sessionId: string): LiveSession {
  const session = requireLiveSession(sessionId);

  session.page.sections = [];
  session.updatedAt = now();
  session.version += 1;

  return session;
}
