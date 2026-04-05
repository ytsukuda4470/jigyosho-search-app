'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { KyotenFilter } from '@/components/KyotenFilter';
import { JigyoshoCard } from '@/components/JigyoshoCard';
import { fetchJigyoshoList } from '@/lib/master-api';
import type { Jigyosho } from '@/lib/types';

const PAGE_SIZE = 50;

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [kyoten, setKyoten] = useState('');
  const [data, setData] = useState<Jigyosho[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredData = search
    ? data.filter((j) => {
        const q = search.toLowerCase();
        return (
          j.名称.toLowerCase().includes(q) ||
          (j['名称_ｶﾅ'] || '').toLowerCase().includes(q) ||
          (j.正式名称 || '').toLowerCase().includes(q) ||
          (j['住所_市区町村'] || '').includes(q) ||
          (j['住所_その他'] || '').includes(q) ||
          (j.TEL || '').includes(q) ||
          (j.事業所番号 || '').includes(q)
        );
      })
    : data;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchJigyoshoList({
        kyoten: kyoten || undefined,
        limit: 1000,
      });
      setData(res.data);
      setTotal(res.total);
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [kyoten]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (user) fetchData();
  }, [user, authLoading, router, fetchData]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full">
        <div className="sticky top-14 z-40 bg-[var(--background)] px-4 py-3 space-y-3 border-b border-gray-100">
          <SearchBar value={search} onChange={setSearch} />
          <div className="flex items-center justify-between">
            <KyotenFilter value={kyoten} onChange={setKyoten} />
            <span className="text-xs text-gray-400">
              {filteredData.length} / {total}件
            </span>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
            </div>
          ) : filteredData.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              {search ? '検索結果がありません' : '事業所データがありません'}
            </p>
          ) : (
            filteredData.slice(0, visibleCount).map((j) => (
              <JigyoshoCard key={j.id} jigyosho={j} />
            ))
          )}

          {!loading && filteredData.length > visibleCount && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="btn-action w-full py-3 text-sm text-[var(--color-primary)] font-medium hover:bg-blue-50 rounded-lg transition"
            >
              もっと見る（残り {filteredData.length - visibleCount} 件）
            </button>
          )}
        </div>
      </main>
    </>
  );
}
