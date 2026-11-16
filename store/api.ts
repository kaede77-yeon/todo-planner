import type { ApiErrorBody } from "@/types";

function isErrorBody(v: unknown): v is ApiErrorBody {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { error?: unknown }).error === "string"
  );
}

/** JSON fetch helper; throws Error with the server's {error} message on non-2xx. */
export async function request<T>(
  url: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: { "content-type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (res.status === 401 && typeof window !== "undefined") {
    // Session expired or invalidated: go sign in again.
    window.location.assign("/login");
  }
  if (!res.ok) {
    throw new Error(
      isErrorBody(data) ? data.error : `Request failed (${res.status})`
    );
  }
  return data as T;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}
