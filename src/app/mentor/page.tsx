'use client';

import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  GraduationCap,
  Briefcase,
  Award,
  Heart,
  Sparkles,
  User,
} from 'lucide-react';

export default function MentorPage() {
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

      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-1 mb-4">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
             {/* Можно добавить реальное фото через тег <img src={...} /> */}
             <User className="w-12 h-12 text-zinc-300" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Айнур 👑</h1>
        <p className="text-[var(--tg-theme-hint-color)] font-medium">Твой SENU Ментор</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-3xl text-center">
          <GraduationCap className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <span className="text-[10px] font-bold uppercase opacity-50 block mb-1">Обучение</span>
          <p className="text-xs font-semibold">GWU (USA)</p>
        </div>
        <div className="p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-3xl text-center">
          <Briefcase className="w-6 h-6 mx-auto mb-2 text-orange-500" />
          <span className="text-[10px] font-bold uppercase opacity-50 block mb-1">Опыт</span>
          <p className="text-xs font-semibold">10+ лет в NU</p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="font-bold mb-4 text-xs uppercase tracking-wider opacity-60 px-2">Экспертиза</h3>
        
        <div className="flex gap-4 items-center p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl">
          <Award className="w-5 h-5 text-yellow-500" />
          <p className="text-sm font-medium">Bolashak Alumni</p>
        </div>

        <div className="flex gap-4 items-center p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl">
          <Heart className="w-5 h-5 text-red-500" />
          <p className="text-sm font-medium">Психологическая фасилитация</p>
        </div>

        <div className="flex gap-4 items-center p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <p className="text-sm font-medium">Сертифицированный мастер «108»</p>
        </div>
      </section>

      <div className="mt-8 px-4 text-center italic text-sm text-[var(--tg-theme-hint-color)]">
        «Моя миссия — помогать студентам находить свой путь к успеху без потери внутреннего баланса.»
      </div>
    </main>
  );
}
