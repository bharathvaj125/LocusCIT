import { SessionUser } from "./types";

/** Signed-in user and token. Kept for this browser tab only (sessionStorage): a reload keeps you signed in, a new visit starts at the intro and the sign-in page. */
export interface StoredSession {
  token: string;
  user: SessionUser;
  expiresAt: number; // epoch ms
}

const KEY = "locus_session";

export function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    window.localStorage.removeItem(KEY);                 // older versions kept the session across visits
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession;
    if (!s.token || !s.user || Date.now() > s.expiresAt) {
      window.sessionStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function saveSession(s: StoredSession): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode: the session simply lasts for this tab */
  }
}

export function clearSession(): void {
  try {
    window.sessionStorage.removeItem(KEY);
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
