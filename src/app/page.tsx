'use client';

import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { 
  Calendar, 
  MessageCircleQuestion, 
  Dice5, 
  UserCircle, 
  LifeBuoy, 
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      WebApp.ready();
      setUser(WebApp.initDataUnsafe.user);
    }
  }, []);

  const menuItems = [
    { 
      title: 'Запись на встречу', 
      icon: <Calendar className="w-6 h-6 text-blue-500" />, 
      href: '/meeting', 
      desc: 'Академический совет или беседа' 
    },
    { 
      title: 'Игра «108»', 
      icon: <Dice5 className="w-6 h-6 text-purple-500" />, 
      href: '/game', 
      desc: 'Трансформационная сессия' 
    },
    { 
      title: 'Задать вопрос', 
      icon: <MessageCircleQuestion className="w-6 h-6 text-green-500" />, 
      href: '/question', 
      desc: 'Анонимно или открыто' 
    },
    { 
      title: 'О менторе', 
      icon: <UserCircle className="w-6 h-6 text-orange-500" />, 
      href: '/mentor', 
      desc: 'История и опыт Айнур' 
    },
    { 
      title: 'Совет дня', 
      icon: <Lightbulb className="w-6 h-6 text-yellow-500" />, 
      href: '/tip', 
      desc: 'Ежедневная мудрость' 
    },
    { 
      title: 'Помощь (PCS)', 
      icon: <LifeBuoy className="w-6 h-6 text-red-500" />, 
      href: '/pcs', 
      desc: 'Психологическая поддержка' 
    },
  ];

  return (
    <main className="p-4 max-w-lg mx-auto pb-20">
      <header className="mb-8 mt-4 animate-in fade-in slide-in-from-top duration-700">
        <h1 className="text-2xl font-bold mb-1">
          Привет, {user?.first_name || 'Студент'}! 👋
        </h1>
        <p className="text-[var(--tg-theme-hint-color)] text-sm">
          Твой SENU-помощник готов к работе
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3">
        {menuItems.map((item, idx) => (
          <Link 
            key={idx} 
            href={item.href}
            className="flex items-center p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl hover:bg-[var(--tg-theme-bg-color)] border border-transparent hover:border-[var(--tg-theme-button-color)] transition-all active:scale-95 group shadow-sm"
          >
            <div className="p-3 bg-white/10 dark:bg-white/5 rounded-xl mr-4 group-hover:bg-white/20 transition-colors">
              {item.icon}
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-xs text-[var(--tg-theme-hint-color)] leading-tight">{item.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--tg-theme-hint-color)] group-hover:text-[var(--tg-theme-button-color)] transition-colors" />
          </Link>
        ))}
      </section>

      <footer className="mt-10 text-center text-[var(--tg-theme-hint-color)] text-[10px] uppercase tracking-widest opacity-50 font-medium">
        SENU Digital Mentor v2.0
      </footer>
    </main>
  );
}
