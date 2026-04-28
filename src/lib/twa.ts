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

export function formatTwaError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Неизвестная ошибка.';
}

async function showTwaAlertMessage(message: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const w = await import('@twa-dev/sdk').then((m) => m.default);
    if (typeof w.showAlert === 'function') {
      w.showAlert(message);
      return;
    }
  } catch {
    /* SDK не загрузился */
  }
  window.alert(message);
}

/** Показать ошибку: в Telegram — нативный alert, иначе window.alert. */
export async function showTwaError(err: unknown): Promise<void> {
  const msg = formatTwaError(err);
  await showTwaAlertMessage(msg);
}

/** Показать информативное сообщение пользователю. */
export async function showTwaAlert(message: string): Promise<void> {
  await showTwaAlertMessage(message);
}

const SEND_DATA_HINT =
  'Не удалось отправить данные боту. Откройте мини-приложение из чата с ботом в Telegram (кнопка или меню), не из обычного браузера.';

/** Отправка в бота через sendData с показом ошибок пользователю. */
export async function sendTwaData(data: object): Promise<boolean> {
  try {
    const payload = JSON.stringify(data);
    if (payload.length > 4096) {
      throw new Error('Слишком длинное сообщение для Telegram (макс. 4096 символов).');
    }
    const WebApp = await loadWebApp();
    try {
      WebApp.sendData(payload);
    } catch {
      throw new Error(SEND_DATA_HINT);
    }
    return true;
  } catch (e) {
    await showTwaError(e instanceof Error ? e : new Error(SEND_DATA_HINT));
    return false;
  }
}

type TgUserPayload = {
  id: number;
  username?: string;
  full_name: string;
};

function extractTgUser(webApp: WebAppModule): TgUserPayload {
  const user = webApp.initDataUnsafe?.user;
  if (!user?.id) {
    throw new Error('Не удалось определить пользователя Telegram. Открой Mini App из чата с ботом.');
  }
  return {
    id: user.id,
    username: user.username,
    full_name: [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || 'Telegram User',
  };
}

export async function getCurrentTgUser(): Promise<TgUserPayload> {
  const webApp = await loadWebApp();
  try {
    return extractTgUser(webApp);
  } catch {
    if (process.env.NODE_ENV === 'development') {
      const id = Number(process.env.NEXT_PUBLIC_DEV_TG_ID);
      if (Number.isFinite(id) && id > 0) {
        return {
          id,
          username: process.env.NEXT_PUBLIC_DEV_TG_USERNAME || undefined,
          full_name: process.env.NEXT_PUBLIC_DEV_TG_FULL_NAME || 'Dev User',
        };
      }
    }
    throw new Error('Не удалось определить пользователя Telegram. Открой Mini App из чата с ботом.');
  }
}

/** Лёгкая тактильная отдача в Telegram (если доступно). */
export async function twaHapticLight(): Promise<void> {
  try {
    const w = await loadWebApp();
    w.HapticFeedback?.impactOccurred?.('light');
  } catch {
    /* ignore */
  }
}

export async function twaHapticSuccess(): Promise<void> {
  try {
    const w = await loadWebApp();
    w.HapticFeedback?.notificationOccurred?.('success');
  } catch {
    /* ignore */
  }
}

export async function sendRequestViaApi(type: 'question' | 'meeting' | 'game_108', payload: object): Promise<boolean> {
  try {
    const tgUser = await getCurrentTgUser();
    const response = await fetch(`/api/requests/${type}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type, ...payload, tg_user: tgUser }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Ошибка отправки запроса.');
    }
    return true;
  } catch (e) {
    await showTwaError(e instanceof Error ? e : new Error('Не удалось отправить запрос.'));
    return false;
  }
}
