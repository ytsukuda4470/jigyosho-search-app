'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { addVisitLog } from '@/lib/firestore';
import type { VisitMethod } from '@/lib/types';

const METHODS: VisitMethod[] = ['訪問', '電話', 'メール', 'FAX', 'オンライン', 'その他'];

interface Props {
  jigyoshoId: string;
  jigyoshoName: string;
  onAdded: () => void;
}

export function VisitLogForm({ jigyoshoId, jigyoshoName, onAdded }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
        <label className="text-xs text-gray-500 mb-1 block">対応者名</label>
        <input
          type="text"
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
          placeholder="例：田中部長"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">内容 <span className="text-red-500">*</span></label>
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
