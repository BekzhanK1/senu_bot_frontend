'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTwaBackButton } from '@/lib/useTwaBackButton';
import { ChevronLeft, Quote, Share2, Lightbulb } from 'lucide-react';

export default function TipPage() {
  const router = useRouter();
  
  const tips = [
    "Твое ментальное здоровье важнее любой оценки. Сделай перерыв.",
    "Разбивай большие задачи на 5 маленьких шагов — так мозг меньше сопротивляется.",
    "Стакан воды и 10 минут прогулки на свежем воздухе творят чудеса.",
    "Не бойся просить о помощи. Менторство — это путь двоих.",
    "Техника 'Помидоро' (25 мин работа / 5 мин отдых) спасет твою сессию."
  ];

  const [currentTip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);

  useTwaBackButton(router);

  return (
    <main className="p-4 min-h-screen animate-in fade-in duration-500 bg-gradient-to-b from-yellow-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      <div className="flex items-center gap-2 mb-10 text-[var(--tg-theme-button-color)]" onClick={() => router.back()}>
        <ChevronLeft className="w-5 h-5" />
        <span className="font-medium">Назад</span>
      </div>

      <div className="relative p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-yellow-100 dark:border-zinc-800 animate-in zoom-in duration-500">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        
        <Quote className="w-10 h-10 text-yellow-200 dark:text-zinc-700 mb-4" />
        
        <h2 className="text-xl font-bold mb-4">Совет дня</h2>
        <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
          {currentTip}
        </p>

        <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-zinc-400">
          <span className="text-xs font-bold uppercase tracking-widest">SENU Mentor</span>
          <button className="flex items-center gap-2 text-[var(--tg-theme-button-color)] active:scale-90 transition-transform">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mt-12 text-center text-xs text-[var(--tg-theme-hint-color)] opacity-60">
        Возвращайся завтра за новой порцией вдохновения ✨
      </div>
    </main>
  );
}
