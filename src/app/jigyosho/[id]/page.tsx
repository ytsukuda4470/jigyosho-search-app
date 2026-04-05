'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Header } from '@/components/Header';
import { ActionButtons } from '@/components/ActionButtons';
import { NoteForm } from '@/components/NoteForm';
import { NoteList } from '@/components/NoteList';
import { fetchJigyoshoList, buildAddress } from '@/lib/master-api';
import { getNotes } from '@/lib/firestore';
import type { Jigyosho, JigyoshoNote } from '@/lib/types';

export default function JigyoshoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const decodedId = decodeURIComponent(id);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jigyosho, setJigyosho] = useState<Jigyosho | null>(null);
  const [notes, setNotes] = useState<JigyoshoNote[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    if (!jigyosho) return;
    const n = await getNotes(jigyosho.統合事業所ID || jigyosho.id);
    setNotes(n);
  }, [jigyosho]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (!user) return;

    (async () => {
      try {
        const res = await fetchJigyoshoList({ limit: 1000 });
        const found = res.data.find((j) => j.id === decodedId);
        if (found) setJigyosho(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router, decodedId]);

  useEffect(() => {
    if (jigyosho) loadNotes();
  }, [jigyosho, loadNotes]);

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
        </div>
      </>
    );
  }

  if (!jigyosho) {
    return (
      <>
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <p className="text-gray-500">事業所が見つかりません</p>
          <button
            onClick={() => router.back()}
            className="text-[var(--color-primary)] text-sm hover:underline"
          >
            戻る
          </button>
        </div>
      </>
    );
  }

  const address = buildAddress(jigyosho);
  const noteKey = jigyosho.統合事業所ID || jigyosho.id;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 space-y-4">
        {/* 戻るボタン */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          一覧に戻る
        </button>

        {/* 基本情報カード */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div>
            <h1 className="text-lg font-bold">{jigyosho.名称}</h1>
            {jigyosho.正式名称 && jigyosho.正式名称 !== jigyosho.名称 && (
              <p className="text-sm text-gray-500">{jigyosho.正式名称}</p>
            )}
            {jigyosho.事業所番号 && (
              <p className="text-xs text-gray-400 mt-1">事業所番号: {jigyosho.事業所番号}</p>
            )}
          </div>

          {address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                {jigyosho['住所_郵便番号'] && `〒${jigyosho['住所_郵便番号']} `}
                {address}
              </span>
            </div>
          )}

          {jigyosho.TEL && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>TEL: {jigyosho.TEL}</span>
            </div>
          )}

          {jigyosho.FAX && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>FAX: {jigyosho.FAX}</span>
            </div>
          )}

          {jigyosho.eメール && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{jigyosho.eメール}</span>
            </div>
          )}

          {jigyosho.HomePage && (
            <a
              href={jigyosho.HomePage.startsWith('http') ? jigyosho.HomePage : `https://${jigyosho.HomePage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              ホームページ
            </a>
          )}
        </div>

        {/* アクションボタン */}
        <ActionButtons jigyosho={jigyosho} />

        {/* 追加情報セクション */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-gray-700">追加情報</h2>
          <NoteForm jigyoshoId={noteKey} onAdded={loadNotes} />
          <NoteList notes={notes} onDeleted={loadNotes} />
        </div>
      </main>
    </>
  );
}
