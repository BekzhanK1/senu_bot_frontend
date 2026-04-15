'use client';

import { useEffect } from 'react';
import { loadWebApp } from './twa';

export function useTwaBackButton(router: { back: () => void }) {
  useEffect(() => {
    let cancelled = false;
    void loadWebApp().then((w) => {
      if (cancelled) return;
      w.BackButton.show();
      w.BackButton.onClick(() => router.back());
    });
    return () => {
      cancelled = true;
      void loadWebApp().then((w) => w.BackButton.hide()).catch(() => {});
    };
  }, [router]);
}
