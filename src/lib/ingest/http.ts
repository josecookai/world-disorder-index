export async function fetchText(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<string> {
  const controller = new AbortController();
  const timeoutMs = init?.timeoutMs ?? 12000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "world-disorder-index/0.1",
        accept: "application/json, text/xml, application/xml, text/html;q=0.9, */*;q=0.8",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const text = await fetchText(url, init);
  return JSON.parse(text) as T;
}
