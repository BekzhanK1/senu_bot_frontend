/** Lazy-load Telegram WebApp SDK so Next.js SSR does not touch `window`. */

type WebAppModule = typeof import('@twa-dev/sdk').default;

let cached: Promise<WebAppModule> | null = null;

export function loadWebApp(): Promise<WebAppModule> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('WebApp is client-only'));
  }
  cached ??= import('@twa-dev/sdk').then((m) => m.default);
  return cached;
}
