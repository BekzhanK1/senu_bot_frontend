'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendTwaData, showTwaAlert } from '@/lib/twa';
import { useTwaBackButton } from '@/lib/useTwaBackButton';
import { ChevronLeft, Sparkles, Target, Zap, Users } from 'lucide-react';

export default function GamePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useTwaBackButton(router);

  const handleJoin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const ok = await sendTwaData({ type: 'game_108' });
    if (ok) {
      await showTwaAlert('Отлично, заявка на игру отправлена.');
    }
    setIsSubmitting(false);
  };

  return (
    <main className="p-4 min-h-screen animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6 text-[var(--tg-theme-button-color)]" onClick={() => router.back()}>
        <ChevronLeft className="w-5 h-5" />
        <span className="font-medium">Назад</span>
      </div>

      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700 p-6 text-white mb-8 shadow-xl">
        <Sparkles className="absolute top-4 right-4 w-12 h-12 opacity-20" />
        <h1 className="text-3xl font-bold mb-2">Игра «108»</h1>
        <p className="opacity-90 text-sm">Трансформационный путь к твоим истинным целям.</p>
      </div>

      <div className="space-y-6 mb-24">
        <div className="flex gap-4 items-start p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600"><Target className="w-6 h-6" /></div>
          <div>
            <h4 className="font-bold mb-1">Ясность целей</h4>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Пойми, чего ты хочешь на самом деле, отбросив лишний шум.</p>
          </div>
        </div>

        <div className="flex gap-4 items-start p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600"><Zap className="w-6 h-6" /></div>
          <div>
            <h4 className="font-bold mb-1">Прорыв</h4>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Найди скрытые блоки, которые мешают тебе двигаться вперед.</p>
          </div>
        </div>

        <div className="flex gap-4 items-start p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600"><Users className="w-6 h-6" /></div>
          <div>
            <h4 className="font-bold mb-1">Групповая динамика</h4>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Энергия группы помогает увидеть ситуацию с разных сторон.</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-4 right-4">
        <button
          onClick={handleJoin}
          disabled={isSubmitting}
          className="w-full p-4 bg-purple-600 text-white rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          {isSubmitting ? 'Отправка...' : 'Хочу сыграть!'}
        </button>
      </div>
    </main>
  );
}
