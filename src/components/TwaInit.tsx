'use client';

import { useEffect } from 'react';
import { loadWebApp, showTwaError } from '@/lib/twa';

/** ready() на всех маршрутах + видимая ошибка, если SDK не поднялся. */
export function TwaInit() {
  useEffect(() => {
    void loadWebApp()
      .then((w) => {
        w.ready();
        w.expand?.();
      })
      .catch((e) => {
        void showTwaError(
          e instanceof Error
            ? e
            : new Error('Не удалось инициализировать Telegram WebApp.')
        );
      });
  }, []);
  return null;
}
