// src/lib/api.ts
import { env } from "@/env";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${env.gatewayUrl}/${cleanPath}`;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  // 3. Gọi Fetch
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : (options.body as string | undefined),
  });

  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error(`Invalid JSON response: ${text.substring(0, 50)}...`);
  }

  if (!res.ok) {
    const errorMsg =
      data?.message ||
      data?.Message ||
      res.statusText ||
      "Something went wrong";
    throw new Error(errorMsg);
  }

  return data;
}
