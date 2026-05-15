export type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

type ApiJsonOptions = RequestInit & {
  timeoutMs?: number;
};

export async function apiJson<T>(url: string, options: ApiJsonOptions = {}): Promise<T> {
  const { timeoutMs = 20_000, signal, headers, ...init } = options;
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      let message = `Request failed with ${res.status}`;
      try {
        const payload = (await res.json()) as ApiErrorPayload;
        message = payload.message || payload.error || message;
      } catch {
        // Keep the status-based fallback when the body is empty or non-JSON.
      }
      throw new ApiRequestError(message, res.status);
    }

    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiRequestError('Request timed out', 408);
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}
