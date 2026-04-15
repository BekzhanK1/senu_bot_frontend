type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  cache?: RequestCache;
};

type ErrorPayload = { detail?: string; message?: string };

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query.set(key, String(value));
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : '';
}

export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const response = await fetch(url, {
    method,
    cache: options.cache ?? 'no-store',
    headers: { 'content-type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

async function extractErrorMessage(response: Response): Promise<string> {
  const fallback = `HTTP ${response.status}`;
  try {
    const payload = (await response.json()) as ErrorPayload;
    if (payload.detail && payload.detail.trim()) return payload.detail;
    if (payload.message && payload.message.trim()) return payload.message;
    return fallback;
  } catch {
    const text = await response.text();
    return text.trim() || fallback;
  }
}
