/**
 * Authentication client — stores JWT in localStorage.
 * Communicates with FastAPI /api/auth/signup and /api/auth/signin.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOKEN_KEY = "taskflow_token";
const USER_KEY = "taskflow_user";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

// ── Token storage ─────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function storeSession(session: AuthSession): void {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Public API ────────────────────────────────────────────────

export async function getSession(): Promise<AuthSession | null> {
  if (!isBrowser()) return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  if (!token || !userJson) return null;
  try {
    const user = JSON.parse(userJson) as AuthUser;
    return { user, token };
  } catch {
    clearSession();
    return null;
  }
}

export async function getToken(): Promise<string | null> {
  const session = await getSession();
  return session?.token ?? null;
}

// ── Auth actions ──────────────────────────────────────────────

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<{ session: AuthSession | null; error: string | null }> {
  try {
    const resp = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await resp.json();

    if (!resp.ok) {
      const msg =
        json.detail || json.error?.message || "Registration failed";
      return { session: null, error: msg };
    }

    const session: AuthSession = {
      user: json.data.user,
      token: json.data.token,
    };
    storeSession(session);
    return { session, error: null };
  } catch {
    return { session: null, error: "Cannot connect to server" };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ session: AuthSession | null; error: string | null }> {
  try {
    const resp = await fetch(`${API_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await resp.json();

    if (!resp.ok) {
      const msg =
        json.detail || json.error?.message || "Invalid credentials";
      return { session: null, error: msg };
    }

    const session: AuthSession = {
      user: json.data.user,
      token: json.data.token,
    };
    storeSession(session);
    return { session, error: null };
  } catch {
    return { session: null, error: "Cannot connect to server" };
  }
}

export function signOut(): void {
  clearSession();
}
