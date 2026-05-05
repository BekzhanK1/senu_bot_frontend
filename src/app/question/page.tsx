'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendRequestViaApi, showTwaAlert, showTwaError } from '@/lib/twa';
import { useTwaBackButton } from '@/lib/useTwaBackButton';
import { ChevronLeft, Send, ShieldCheck, User } from 'lucide-react';

export default function QuestionPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useTwaBackButton(router);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      await showTwaError('Пожалуйста, введите ваше ФИО.');
      return;
    }
    if (!text.trim()) {
      await showTwaError('Напиши вопрос перед отправкой.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    const ok = await sendRequestViaApi('question', {
      text: text.trim(),
      full_name_input: fullName.trim(),
    });
    if (ok) {
      setText('');
      setFullName('');
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

      <div className="mb-4">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ваше ФИО (обязательно)"
          className="w-full p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl border-2 border-transparent focus:border-[var(--tg-theme-button-color)] transition-all outline-none text-sm font-medium"
        />
      </div>

      <div className="mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Твой вопрос..."
          className="w-full min-h-[150px] p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl border-2 border-transparent focus:border-[var(--tg-theme-button-color)] transition-all resize-none outline-none text-sm"
        />
      </div>

      <button
        disabled={!text.trim() || !fullName.trim() || isSubmitting}
        onClick={handleSubmit}
        className="w-full p-4 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send className="w-5 h-5" />
        {isSubmitting ? 'Отправка...' : 'Отправить вопрос'}
      </button>
    </main>
  );
}
