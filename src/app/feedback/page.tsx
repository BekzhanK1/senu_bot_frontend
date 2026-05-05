'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { callApi, showTwaAlert, showTwaError } from '@/lib/twa';
import { useTwaBackButton } from '@/lib/useTwaBackButton';
import { ChevronLeft, Send, MessageSquareHeart } from 'lucide-react';

export default function FeedbackPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useTwaBackButton(router);

  const handleSubmit = async () => {
    if (!text.trim()) {
      await showTwaError('Пожалуйста, напишите ваш отзыв.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    const ok = await callApi('feedback', 'POST', {
      text: text.trim(),
    });
    if (ok) {
      setText('');
      await showTwaAlert('Спасибо за ваш отзыв! Мы ценим ваше мнение.');
      router.back();
    } else {
      await showTwaError('Произошла ошибка при отправке.');
    }
    setIsSubmitting(false);
  };

  return (
    <main className="p-4 min-h-screen animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6 text-[var(--tg-theme-button-color)]" onClick={() => router.back()}>
        <ChevronLeft className="w-5 h-5" />
        <span className="font-medium">Назад</span>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <MessageSquareHeart className="w-8 h-8 text-pink-500" />
        <h1 className="text-2xl font-bold">Оставить фидбек</h1>
      </div>
      
      <p className="text-[var(--tg-theme-hint-color)] text-sm mb-6 leading-relaxed">
        Поделитесь своими мыслями, предложениями или просто скажите спасибо! Ваш отзыв поможет нам стать лучше.
      </p>

      <div className="mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ваш отзыв..."
          className="w-full min-h-[180px] p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl border-2 border-transparent focus:border-[var(--tg-theme-button-color)] transition-all resize-none outline-none text-sm"
        />
      </div>

      <button
        disabled={!text.trim() || isSubmitting}
        onClick={handleSubmit}
        className="w-full p-4 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send className="w-5 h-5" />
        {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
      </button>
    </main>
  );
}
