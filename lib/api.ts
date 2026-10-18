"use client";
export const apiBase = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
).replace(/\/$/, "");
type Tokens = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; role: string };
};
let refreshing: Promise<void> | null = null;
export function session(): Tokens | null {
  try {
    return JSON.parse(sessionStorage.getItem("roxodeal-session") || "null");
  } catch {
    return null;
  }
}
export function setSession(value: Tokens | null) {
  if (value) sessionStorage.setItem("roxodeal-session", JSON.stringify(value));
  else sessionStorage.removeItem("roxodeal-session");
  window.dispatchEvent(new Event("roxodeal-session"));
}
export async function api<T = any>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = session()?.accessToken;
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", "Bearer " + token);
  let response: Response;
  try {
    response = await fetch(apiBase + path, {
      ...init,
      headers,
      cache: "no-store",
      signal: init.signal || AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error("Cannot reach the Roxodeal API. Please try again later.");
  }
  if (
    response.status === 401 &&
    retry &&
    !path.startsWith("/auth/") &&
    session()?.refreshToken
  ) {
    if (!refreshing) {
      const refreshToken = session()!.refreshToken;
      refreshing = api<Tokens>(
        "/auth/refresh",
        { method: "POST", body: JSON.stringify({ refreshToken }) },
        false,
      )
        .then(setSession)
        .catch((e) => {
          setSession(null);
          throw e;
        })
        .finally(() => {
          refreshing = null;
        });
    }
    await refreshing;
    return api<T>(path, init, false);
  }
  const result = await response
    .json()
    .catch(() => ({ message: "Server returned an invalid response" }));
  if (!response.ok)
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(". ")
        : result.message || "Request failed",
    );
  return result;
}
export const action = (
  action: string,
  id: string | undefined,
  data: Record<string, unknown>,
) =>
  api("/workspace/actions", {
    method: "POST",
    body: JSON.stringify({ action, id, data }),
  });
