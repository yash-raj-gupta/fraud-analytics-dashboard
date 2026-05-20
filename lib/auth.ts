// Mock client-side auth for demo purposes only.
// Real banking auth would go through OAuth/SSO + server-side sessions.
"use client";

const KEY = "fa.session";

export type Session = { email: string; loggedAt: number };

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function login(email: string) {
  if (typeof window === "undefined") return;
  const sess: Session = { email, loggedAt: Date.now() };
  window.localStorage.setItem(KEY, JSON.stringify(sess));
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
