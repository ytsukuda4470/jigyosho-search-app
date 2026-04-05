'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { AppLayout } from '@/components/AppLayout';
import { getAllVisitLogs, getUpcomingActions, getStarredJigyosho } from '@/lib/firestore';
import type { VisitLog, JigyoshoStatus } from '@/lib/types';

const METHOD_COLORS: Record<string, string> = {
  訪問: 'bg-green-100 text-green-700',
  電話: 'bg-blue-100 text-blue-700',
  メール: 'bg-orange-100 text-orange-700',
  FAX: 'bg-purple-100 text-purple-700',
  オンライン: 'bg-cyan-100 text-cyan-700',
  その他: 'bg-gray-100 text-gray-600',
};

const RELATION_COLORS: Record<string, string> = {
  '未接触': 'bg-gray-100 text-gray-500',
  '接触済': 'bg-blue-100 text-blue-600',
  '取引中': 'bg-green-100 text-green-700',
  '休眠': 'bg-yellow-100 text-yellow-700',
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [recentLogs, setRecentLogs] = useState<VisitLog[]>([]);
  const [upcomingActions, setUpcomingActions] = useState<VisitLog[]>([]);
  const [starred, setStarred] = useState<JigyoshoStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (!user) return;
    (async () => {
      try {
        const [logs, actions, stars] = await Promise.all([
          getAllVisitLogs(20),
          getUpcomingActions(10),
          getStarredJigyosho(),
        ]);
        setRecentLogs(logs);
        setUpcomingActions(actions);
        setStarred(stars);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 space-y-5">
        <h1 className="text-lg font-bold text-gray-800">ダッシュボード</h1>

        {/* 次回アクション */}
        {upcomingActions.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              次回アクション予定 ({upcomingActions.length})
            </h2>
            <div className="space-y-2">
              {upcomingActions.map((log) => (
                <Link
                  key={log.id}
                  href={`/jigyosho/${encodeURIComponent(log.jigyoshoId)}`}
                  className="block bg-yellow-50 border border-yellow-100 rounded-xl p-3 hover:bg-yellow-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{log.jigyoshoName}</span>
                    <span className="text-xs text-yellow-700 font-medium">{log.nextDate}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{log.nextAction}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* スター事業所 */}
        {starred.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              スター事業所 ({starred.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {starred.map((s) => (
                <Link
                  key={s.jigyoshoId}
                  href={`/jigyosho/${encodeURIComponent(s.jigyoshoId)}`}
                  className="block bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate">{s.jigyoshoId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RELATION_COLORS[s.relationStatus] || ''}`}>
                      {s.relationStatus}
                    </span>
                  </div>
                  {s.websiteSummary && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.websiteSummary}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 最近の営業記録 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            最近の営業記録
          </h2>
          {recentLogs.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">記録はありません</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <Link
                  key={log.id}
                  href={`/jigyosho/${encodeURIComponent(log.jigyoshoId)}`}
                  className="block bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-gray-800 truncate">{log.jigyoshoName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${METHOD_COLORS[log.method] || METHOD_COLORS['その他']}`}>
                        {log.method}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{log.date}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{log.content}</p>
                  {log.contact && <p className="text-xs text-gray-400 mt-0.5">{log.contact}</p>}
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppLayout>
  );
}
