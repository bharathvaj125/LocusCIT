import { SessionUser } from "./types";

/** Signed-in user and token, kept in localStorage so a page reload keeps you logged in. */
export interface StoredSession {
  token: string;
  user: SessionUser;
  expiresAt: number; // epoch ms
}

const KEY = "locus_session";

export function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession;
    if (!s.token || !s.user || Date.now() > s.expiresAt) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function saveSession(s: StoredSession): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode: the session simply lasts for this tab */
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
