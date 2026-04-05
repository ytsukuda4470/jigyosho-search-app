'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { upsertJigyoshoStatus } from '@/lib/firestore';
import type { JigyoshoStatus, RelationStatus } from '@/lib/types';

const RELATION_STATUSES: RelationStatus[] = ['未接触', '接触済', '取引中', '休眠'];

const RELATION_COLORS: Record<RelationStatus, string> = {
  '未接触': 'bg-gray-100 text-gray-500',
  '接触済': 'bg-blue-100 text-blue-600',
  '取引中': 'bg-green-100 text-green-700',
  '休眠': 'bg-yellow-100 text-yellow-700',
};

interface Props {
  jigyoshoId: string;
  jigyoshoName: string;
  status: JigyoshoStatus | null;
  onChanged: () => void;
}

export function JigyoshoStatusPanel({ jigyoshoId, jigyoshoName, status, onChanged }: Props) {
  const { user } = useAuth();
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(status?.websiteUrl || '');
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const currentRelation = status?.relationStatus ?? '未接触';
  const starred = status?.starred ?? false;

  const updateStatus = async (data: Partial<Omit<JigyoshoStatus, 'jigyoshoId' | 'updatedAt'>>) => {
    if (!user) return;
    await upsertJigyoshoStatus(jigyoshoId, { ...data, updatedBy: user.uid });
    onChanged();
  };

  const handleRelationChange = async (rel: RelationStatus) => {
    setLoadingStatus(true);
    try { await updateStatus({ relationStatus: rel }); }
    finally { setLoadingStatus(false); }
  };

  const handleStar = () => updateStatus({ starred: !starred });

  const handleUrlSave = async () => {
    if (!urlInput.trim()) return;
    setLoadingUrl(true);
    try {
      const url = urlInput.trim().startsWith('http') ? urlInput.trim() : `https://${urlInput.trim()}`;
      await updateStatus({ websiteUrl: url });
      // Gemini要約を取得
      try {
        const res = await fetch('/api/gemini/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, jigyoshoName }),
        });
        if (res.ok) {
          const { summary } = await res.json();
          await updateStatus({ websiteUrl: url, websiteSummary: summary, websiteUpdatedAt: new Date() as unknown as undefined });
        }
      } catch {
        // 要約失敗は無視
      }
      setEditingUrl(false);
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleWebSearch = async () => {
    setLoadingUrl(true);
    try {
      const res = await fetch('/api/gemini/websearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jigyoshoName }),
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) {
          setUrlInput(url);
          setEditingUrl(true);
        } else {
          alert('URLが見つかりませんでした');
        }
      }
    } catch {
      alert('検索に失敗しました');
    } finally {
      setLoadingUrl(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">関係ステータス</h3>
        <button
          onClick={handleStar}
          className={`p-1 transition ${starred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
          title={starred ? 'スター解除' : 'スターに追加'}
        >
          <svg className="w-5 h-5" fill={starred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      {/* 関係ステータス選択 */}
      <div className="flex gap-1.5 flex-wrap">
        {RELATION_STATUSES.map((rel) => (
          <button
            key={rel}
            onClick={() => handleRelationChange(rel)}
            disabled={loadingStatus}
            className={`text-xs px-3 py-1 rounded-full font-medium transition border ${
              currentRelation === rel
                ? `${RELATION_COLORS[rel]} border-current`
                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
            }`}
          >
            {rel}
          </button>
        ))}
      </div>

      {/* ウェブサイト */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">WEBサイト</span>
          {!editingUrl && (
            <button
              onClick={() => { setUrlInput(status?.websiteUrl || ''); setEditingUrl(true); }}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              {status?.websiteUrl ? '編集' : '登録'}
            </button>
          )}
        </div>

        {editingUrl ? (
          <div className="space-y-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleUrlSave}
                disabled={loadingUrl || !urlInput.trim()}
                className="flex-1 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loadingUrl ? '保存中...' : '保存・要約'}
              </button>
              <button
                onClick={handleWebSearch}
                disabled={loadingUrl}
                className="px-3 py-1.5 border border-gray-200 text-xs rounded-lg hover:bg-gray-50 transition flex items-center gap-1"
                title="Geminiで検索"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                AI検索
              </button>
              <button onClick={() => setEditingUrl(false)} className="px-3 py-1.5 border border-gray-200 text-xs rounded-lg hover:bg-gray-50 transition">
                ✕
              </button>
            </div>
          </div>
        ) : status?.websiteUrl ? (
          <div className="space-y-1.5">
            <a href={status.websiteUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {status.websiteUrl}
            </a>
            {status.websiteSummary && (
              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{status.websiteSummary}</p>
            )}
            {status.websiteUpdatedAt && (
              <p className="text-xs text-gray-400">
                更新: {new Date(status.websiteUpdatedAt).toLocaleDateString('ja-JP')}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={handleWebSearch}
            disabled={loadingUrl}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {loadingUrl ? 'AI検索中...' : 'AIでWEBサイトを探す'}
          </button>
        )}
      </div>
    </div>
  );
}
