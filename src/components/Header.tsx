'use client';

import { useAuth } from './AuthProvider';
import Link from 'next/link';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-primary)] text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          事業所検索
        </Link>
        {user && (
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-xs bg-white/20 hover:bg-white/30 rounded px-3 py-1.5 transition">
              ダッシュボード
            </Link>
            <span className="text-xs opacity-80 hidden sm:inline">
              {user.displayName}
            </span>
            <button
              onClick={signOut}
              className="text-xs bg-white/20 hover:bg-white/30 rounded px-3 py-1.5 transition"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
