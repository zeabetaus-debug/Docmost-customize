import { getStoredApiKey } from "@/features/zeaatlas/api-keys/hooks/use-api-key";

type ApiKeyFetchOptions = RequestInit & {
  apiKey?: string | null;
};

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiKeyFetch<T = unknown>(
  url: string,
  options: ApiKeyFetchOptions = {},
  explicitApiKey?: string | null,
): Promise<T> {
  const resolvedApiKey =
    explicitApiKey ?? options.apiKey ?? getStoredApiKey() ?? null;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (resolvedApiKey) {
    headers.set("Authorization", `Bearer ${resolvedApiKey}`);
  }

  const response = await fetch(url, {
    ...options,
    credentials: resolvedApiKey ? "omit" : "include",
    headers,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message?: string }).message)
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export function getWithApiKey<T = unknown>(
  url: string,
  apiKey?: string | null,
  options: Omit<ApiKeyFetchOptions, "method" | "body"> = {},
) {
  return apiKeyFetch<T>(url, { ...options, method: "GET" }, apiKey);
}

export function postWithApiKey<T = unknown>(
  url: string,
  body?: unknown,
  apiKey?: string | null,
  options: Omit<ApiKeyFetchOptions, "method" | "body"> = {},
) {
  return apiKeyFetch<T>(
    url,
    {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
    apiKey,
  );
}

export function deleteWithApiKey<T = unknown>(
  url: string,
  apiKey?: string | null,
  options: Omit<ApiKeyFetchOptions, "method" | "body"> = {},
) {
  return apiKeyFetch<T>(url, { ...options, method: "DELETE" }, apiKey);
}
