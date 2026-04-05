'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { addVisitLog } from '@/lib/firestore';
import type { VisitMethod, Contact } from '@/lib/types';

const METHODS: VisitMethod[] = ['訪問', '電話', 'メール', 'FAX', 'オンライン', 'その他'];

const TEMPLATES = [
  '定期連絡。サービス利用状況を確認。特に変化なし。',
  '新規利用者の紹介依頼。資料を提供し検討いただく。',
  '担当ケアマネより連絡あり。利用者の状態変化を共有。',
  'サービス内容について説明。契約に向け検討中。',
  '請求・加算内容について確認。疑問点を解消。',
  'モニタリング訪問。短期目標の達成状況を確認。',
];

interface Props {
  jigyoshoId: string;
  jigyoshoName: string;
  contacts?: Contact[];
  onAdded: () => void;
}

export function VisitLogForm({ jigyoshoId, jigyoshoName, contacts = [], onAdded }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: today,
    method: '訪問' as VisitMethod,
    contact: '',
    content: '',
    nextAction: '',
    nextDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.content.trim()) return;
    setSaving(true);
    try {
      await addVisitLog({
        jigyoshoId,
        jigyoshoName,
        date: form.date,
        method: form.method,
        contact: form.contact,
        content: form.content,
        nextAction: form.nextAction || undefined,
        nextDate: form.nextDate || undefined,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || '',
      });
      setForm({ date: today, method: '訪問', contact: '', content: '', nextAction: '', nextDate: '' });
      setOpen(false);
      onAdded();
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (t: string) => {
    setForm((f) => ({ ...f, content: f.content ? f.content + '\n' + t : t }));
    setShowTemplates(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        営業記録を追加
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-blue-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">営業記録を追加</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">日付</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">手段</label>
          <select
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value as VisitMethod })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">対応者</label>
        {contacts.length > 0 ? (
          <select
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">（選択してください）</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}{c.title ? `（${c.title}）` : ''}
              </option>
            ))}
            <option value="__other__">その他（直接入力）</option>
          </select>
        ) : (
          <input
            type="text"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="例：田中部長"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        )}
        {contacts.length > 0 && form.contact === '__other__' && (
          <input
            type="text"
            placeholder="名前を入力"
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500">内容 <span className="text-red-500">*</span></label>
          <button
            type="button"
            onClick={() => setShowTemplates((v) => !v)}
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            定型文
          </button>
        </div>
        {showTemplates && (
          <div className="mb-2 bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-100">
            {TEMPLATES.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(t)}
                className="w-full text-left text-xs text-gray-600 px-3 py-2 hover:bg-blue-50 hover:text-blue-700 transition first:rounded-t-lg last:rounded-b-lg"
              >
                {t}
              </button>
            ))}
          </div>
        )}
        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="話した内容、商談結果など..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">次回アクション</label>
          <input
            type="text"
            value={form.nextAction}
            onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
            placeholder="例：資料を送付する"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">次回予定日</label>
          <input
            type="date"
            value={form.nextDate}
            onChange={(e) => setForm({ ...form, nextDate: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !form.content.trim()}
        className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {saving ? '保存中...' : '記録を保存'}
      </button>
    </form>
  );
}
