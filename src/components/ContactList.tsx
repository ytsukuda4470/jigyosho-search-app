'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { addContact, updateContact, deleteContact } from '@/lib/firestore';
import type { Contact, ContactStatus } from '@/lib/types';

const STATUS_COLORS: Record<ContactStatus, string> = {
  在職: 'bg-green-100 text-green-700',
  退職: 'bg-red-100 text-red-700',
  異動: 'bg-yellow-100 text-yellow-700',
};

interface Props {
  jigyoshoId: string;
  contacts: Contact[];
  onChanged: () => void;
  onOcrRequest?: (contactId: string) => void;
}

type FormState = { name: string; nameKana: string; title: string; department: string; tel: string; mobile: string; email: string; memo: string };

export function ContactList({ jigyoshoId, contacts, onChanged, onOcrRequest }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<string | null>(null);

  const emptyForm: FormState = { name: '', nameKana: '', title: '', department: '', tel: '', mobile: '', email: '', memo: '' };
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name.trim()) return;
    setSaving(true);
    try {
      await addContact({
        jigyoshoId,
        name: form.name,
        nameKana: form.nameKana || undefined,
        title: form.title,
        department: form.department || undefined,
        tel: form.tel || undefined,
        mobile: form.mobile || undefined,
        email: form.email || undefined,
        status: '在職',
        memo: form.memo || undefined,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || '',
      });
      setForm(emptyForm);
      setShowForm(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: Contact) => {
    setEditForm({
      name: c.name,
      nameKana: c.nameKana || '',
      title: c.title || '',
      department: c.department || '',
      tel: c.tel || '',
      mobile: c.mobile || '',
      email: c.email || '',
      memo: c.memo || '',
    });
    setEditingContact(c.id);
    setEditingStatus(null);
  };

  const handleEdit = async (e: React.FormEvent, contactId: string) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    setSaving(true);
    try {
      await updateContact(contactId, {
        name: editForm.name,
        nameKana: editForm.nameKana || undefined,
        title: editForm.title || undefined,
        department: editForm.department || undefined,
        tel: editForm.tel || undefined,
        mobile: editForm.mobile || undefined,
        email: editForm.email || undefined,
        memo: editForm.memo || undefined,
      });
      setEditingContact(null);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (contactId: string, status: ContactStatus) => {
    await updateContact(contactId, { status });
    setEditingStatus(null);
    onChanged();
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('この担当者を削除しますか？')) return;
    await deleteContact(contactId);
    onChanged();
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <div className="space-y-3">
      {contacts.map((c) => (
        <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          {editingContact === c.id ? (
            <form onSubmit={(e) => handleEdit(e, c.id)} className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700">担当者を編集</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">氏名 <span className="text-red-500">*</span></label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">フリガナ</label>
                  <input type="text" value={editForm.nameKana} onChange={(e) => setEditForm({ ...editForm, nameKana: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">役職</label>
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">部署</label>
                  <input type="text" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">TEL</label>
                  <input type="tel" value={editForm.tel} onChange={(e) => setEditForm({ ...editForm, tel: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">携帯</label>
                  <input type="tel" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">メール</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">メモ</label>
                <input type="text" value={editForm.memo} onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })} className={inputCls} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving || !editForm.name.trim()}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                  {saving ? '保存中...' : '保存'}
                </button>
                <button type="button" onClick={() => setEditingContact(null)}
                  className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition">
                  キャンセル
                </button>
              </div>
            </form>
          ) : (
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-800">{c.name}</span>
                {c.nameKana && <span className="text-xs text-gray-400">{c.nameKana}</span>}
                {editingStatus === c.id ? (
                  <div className="flex gap-1">
                    {(['在職', '退職', '異動'] as ContactStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(c.id, s)}
                        className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[s]} border-current`}
                      >
                        {s}
                      </button>
                    ))}
                    <button onClick={() => setEditingStatus(null)} className="text-xs text-gray-400">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingStatus(c.id)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status]}`}
                  >
                    {c.status}
                  </button>
                )}
              </div>
              {(c.title || c.department) && (
                <p className="text-xs text-gray-500 mt-0.5">{[c.department, c.title].filter(Boolean).join(' / ')}</p>
              )}
              <div className="mt-2 space-y-1">
                {c.tel && (
                  <a href={`tel:${c.tel}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {c.tel}
                  </a>
                )}
                {c.mobile && (
                  <a href={`tel:${c.mobile}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {c.mobile}（携帯）
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {c.email}
                  </a>
                )}
                {c.memo && <p className="text-xs text-gray-500 italic">{c.memo}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {onOcrRequest && (
                <button
                  onClick={() => onOcrRequest(c.id)}
                  title="名刺OCR"
                  className="p-1.5 text-gray-300 hover:text-blue-500 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <button onClick={() => startEdit(c)} title="編集" className="p-1.5 text-gray-300 hover:text-blue-500 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          )}
        </div>
      ))}

      {showForm ? (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-blue-100 p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">担当者を追加</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">氏名 <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="山田 太郎" required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">フリガナ</label>
              <input type="text" value={form.nameKana} onChange={(e) => setForm({ ...form, nameKana: e.target.value })}
                placeholder="ヤマダ タロウ"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">役職</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="所長"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">部署</label>
              <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="営業部"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">TEL</label>
              <input type="tel" value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">携帯</label>
              <input type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">メール</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">メモ</label>
            <input type="text" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="特記事項など"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !form.name.trim()}
              className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {saving ? '保存中...' : '追加'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition">
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          担当者を追加
        </button>
      )}
    </div>
  );
}
