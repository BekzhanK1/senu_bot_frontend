'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendTwaData, showTwaAlert, showTwaError } from '@/lib/twa';
import { useTwaBackButton } from '@/lib/useTwaBackButton';
import { ChevronLeft, Send, ShieldCheck, User } from 'lucide-react';

export default function QuestionPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useTwaBackButton(router);

  const handleSubmit = async () => {
    if (!text.trim()) {
      await showTwaError('Напиши вопрос перед отправкой.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    const ok = await sendTwaData({
      type: 'question',
      text: text.trim(),
      is_anonymous: isAnon,
    });
    if (ok) {
      setText('');
      await showTwaAlert('Вопрос отправлен ментору.');
    }
    setIsSubmitting(false);
  };

  return (
    <main className="p-4 min-h-screen animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6 text-[var(--tg-theme-button-color)]" onClick={() => router.back()}>
        <ChevronLeft className="w-5 h-5" />
        <span className="font-medium">Назад</span>
      </div>

      <h1 className="text-2xl font-bold mb-2">Задай свой вопрос 🕊</h1>
      <p className="text-[var(--tg-theme-hint-color)] text-sm mb-6 leading-relaxed">
        Спроси о чем угодно: учеба, карьера или личный баланс. Ментор ответит тебе в чате.
      </p>

      <div className="mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Твой вопрос..."
          className="w-full min-h-[150px] p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl border-2 border-transparent focus:border-[var(--tg-theme-button-color)] transition-all resize-none outline-none text-sm"
        />
      </div>

      <div className="flex gap-2 p-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl mb-8">
        <button
          onClick={() => setIsAnon(false)}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${!isAnon ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'opacity-60'}`}
        >
          <User className="w-4 h-4" />
          <span className="text-xs font-semibold">Открыто</span>
        </button>
        <button
          onClick={() => setIsAnon(true)}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${isAnon ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-500' : 'opacity-60'}`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-semibold">Анонимно</span>
        </button>
      </div>

      <button
        disabled={!text.trim() || isSubmitting}
        onClick={handleSubmit}
        className="w-full p-4 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send className="w-5 h-5" />
        {isSubmitting ? 'Отправка...' : 'Отправить вопрос'}
      </button>
    </main>
  );
}
