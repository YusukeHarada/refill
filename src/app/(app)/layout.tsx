'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/home', icon: Home, label: 'ホーム' },
  { href: '/statistics', icon: BarChart3, label: '統計' },
  { href: '/settings', icon: Settings, label: '設定' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto">
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Bottom navigation */}
      <nav className="flex-shrink-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 safe-area-pb">
        <div className="flex">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href === '/home' && pathname === '/home');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors',
                  active ? 'text-indigo-600' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300',
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
