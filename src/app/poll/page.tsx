'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { callApi, showTwaAlert, showTwaError } from '@/lib/twa';
import { useTwaBackButton } from '@/lib/useTwaBackButton';
import { ChevronLeft, Plus, ThumbsUp, Loader2 } from 'lucide-react';

export default function PollPage() {
  const router = useRouter();
  const [poll, setPoll] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newTopic, setNewTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useTwaBackButton(router);

  const fetchPoll = async () => {
    setIsLoading(true);
    const res = await callApi('poll', 'GET');
    if (res && res.active) {
      setPoll(res.poll);
    } else {
      setPoll(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPoll();
  }, []);

  const handleVote = async (topicId: number) => {
    const ok = await callApi('poll/vote', 'POST', { topic_id: topicId });
    if (ok) {
      await fetchPoll();
    } else {
      await showTwaError('Ошибка при голосовании');
    }
  };

  const handleSuggest = async () => {
    if (!newTopic.trim()) return;
    setIsSubmitting(true);
    const ok = await callApi('poll/topic', 'POST', { title: newTopic.trim() });
    if (ok) {
      setNewTopic('');
      await fetchPoll();
      await showTwaAlert('Тема успешно предложена!');
    } else {
      await showTwaError('Ошибка при предложении темы');
    }
    setIsSubmitting(false);
  };

  return (
    <main className="p-4 min-h-screen animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6 text-[var(--tg-theme-button-color)]" onClick={() => router.back()}>
        <ChevronLeft className="w-5 h-5" />
        <span className="font-medium">Назад</span>
      </div>

      <h1 className="text-2xl font-bold mb-2">Голосование 📊</h1>
      <p className="text-[var(--tg-theme-hint-color)] text-sm mb-6 leading-relaxed">
        Предлагайте темы для предстоящих групповых встреч и голосуйте за наиболее интересные!
      </p>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--tg-theme-button-color)]" />
        </div>
      ) : poll ? (
        <>
          <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-4 mb-6">
            <h2 className="font-bold text-lg mb-4">{poll.title}</h2>
            
            <div className="space-y-3">
              {poll.topics && poll.topics.length > 0 ? (
                poll.topics.map((t: any) => (
                  <div key={t.id} className="flex flex-col p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex-1 mr-2">{t.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--tg-theme-hint-color)]">{t.votes}</span>
                        <button 
                          onClick={() => handleVote(t.id)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors dark:bg-blue-900/30"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-[var(--tg-theme-hint-color)]">
                      {t.suggested_by ? `👤 Предложил(а): ${t.author_name || 'Студент'}` : '👑 Предложено ментором'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-[var(--tg-theme-hint-color)] text-center py-4">
                  Пока нет предложенных тем. Будьте первыми!
                </div>
              )}
            </div>
          </div>

          <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-4">
            <h3 className="font-bold text-sm mb-3">Предложить свою тему</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Ваша тема..."
                className="flex-1 p-3 rounded-xl bg-white dark:bg-zinc-800 outline-none text-sm border border-transparent focus:border-[var(--tg-theme-button-color)] transition-colors"
              />
              <button
                disabled={!newTopic.trim() || isSubmitting}
                onClick={handleSuggest}
                className="p-3 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-xl disabled:opacity-50 transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl text-center">
          <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📭</span>
          </div>
          <h3 className="font-bold mb-2">Нет активных опросов</h3>
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Ментор пока не запустил новое голосование.
          </p>
        </div>
      )}
    </main>
  );
}
