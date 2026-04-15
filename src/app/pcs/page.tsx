'use client';

import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Phone, Globe, MessageSquare, Heart } from 'lucide-react';

export default function PCSPage() {
  const router = useRouter();

  useEffect(() => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(() => router.back());
    return () => WebApp.BackButton.hide();
  }, [router]);

  return (
    <main className="p-4 min-h-screen animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6 text-[var(--tg-theme-button-color)]" onClick={() => router.back()}>
        <ChevronLeft className="w-5 h-5" />
        <span className="font-medium">Назад</span>
      </div>

      <div className="flex flex-col items-center mb-10 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Психологическая помощь</h1>
        <p className="text-sm text-[var(--tg-theme-hint-color)]">Твое ментальное здоровье — наш приоритет.</p>
      </div>

      <div className="space-y-4">
        <a href="tel:111" className="flex items-center p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl active:scale-95 transition-all shadow-sm">
          <div className="p-3 bg-red-500 rounded-xl mr-4 text-white"><Phone className="w-5 h-5" /></div>
          <div className="flex-1">
            <h4 className="font-bold">Линия доверия 111</h4>
            <p className="text-[10px] text-[var(--tg-theme-hint-color)]">Бесплатно и круглосуточно</p>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--tg-theme-hint-color)]" />
        </a>

        <a href="https://t.me/pcs_nu_bot" target="_blank" className="flex items-center p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl active:scale-95 transition-all shadow-sm">
          <div className="p-3 bg-blue-500 rounded-xl mr-4 text-white"><MessageSquare className="w-5 h-5" /></div>
          <div className="flex-1">
            <h4 className="font-bold">Бот PCS NU</h4>
            <p className="text-[10px] text-[var(--tg-theme-hint-color)]">Запись на консультацию</p>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--tg-theme-hint-color)]" />
        </a>

        <a href="https://portal.nu.edu.kz" target="_blank" className="flex items-center p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl active:scale-95 transition-all shadow-sm">
          <div className="p-3 bg-emerald-500 rounded-xl mr-4 text-white"><Globe className="w-5 h-5" /></div>
          <div className="flex-1">
            <h4 className="font-bold">Портал NU</h4>
            <p className="text-[10px] text-[var(--tg-theme-hint-color)]">Скрининг и запись</p>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--tg-theme-hint-color)]" />
        </a>
      </div>

      <div className="mt-12 p-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-3xl text-sm leading-relaxed text-red-800 dark:text-red-300">
        <h4 className="font-bold mb-2">Важно знать:</h4>
        Помни, что обращение за помощью — это признак силы, а не слабости. Ты не один.
      </div>
    </main>
  );
}

import { ChevronRight } from 'lucide-react';
