'use client';

import { useState, useRef } from 'react';
import type { NoteType } from '@/lib/types';
import { NOTE_TYPE_LABELS } from '@/lib/types';
import { useAuth } from './AuthProvider';
import { addNote } from '@/lib/firestore';
import { uploadFile } from '@/lib/storage';

interface Props {
  jigyoshoId: string;
  onAdded: () => void;
}

export function NoteForm({ jigyoshoId, onAdded }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<NoteType>('memo');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const needsFile = type === 'photo' || type === 'document' || type === 'pamphlet';
  const needsUrl = type === 'url';

  const reset = () => {
    setType('memo');
    setTitle('');
    setContent('');
    setDriveUrl('');
    setFile(null);
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setSaving(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileMimeType: string | undefined;

      if (file) {
        const uploaded = await uploadFile(file, jigyoshoId);
        fileUrl = uploaded.url;
        fileName = uploaded.name;
        fileMimeType = uploaded.mimeType;
      }

      await addNote({
        jigyoshoId,
        type,
        title: title.trim(),
        content: needsUrl ? driveUrl : content,
        fileUrl,
        fileName,
        fileMimeType,
        driveUrl: driveUrl || undefined,
        createdBy: user.uid,
        createdByName: user.displayName || 'Unknown',
      });

      reset();
      onAdded();
    } catch (err) {
      console.error('保存エラー:', err);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-action w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition text-sm font-medium"
      >
        + 情報を追加
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">情報を追加</h3>
        <button type="button" onClick={reset} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 種別選択 */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(NOTE_TYPE_LABELS) as [NoteType, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              type === key
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* タイトル */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タイトル"
        required
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
      />

      {/* メモ内容 */}
      {!needsUrl && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="メモ・説明（任意）"
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] resize-none"
        />
      )}

      {/* URL入力 */}
      {(needsUrl || type === 'pamphlet') && (
        <input
          type="url"
          value={driveUrl}
          onChange={(e) => setDriveUrl(e.target.value)}
          placeholder="URL（Googleドライブ等）"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
        />
      )}

      {/* ファイルアップロード */}
      {needsFile && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={type === 'photo' ? 'image/*' : '*/*'}
            capture={type === 'photo' ? 'environment' : undefined}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-action w-full py-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            {file ? file.name : type === 'photo' ? '写真を選択・撮影' : 'ファイルを選択'}
          </button>
        </div>
      )}

      {/* 送信 */}
      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="btn-action w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
      >
        {saving ? '保存中...' : '保存'}
      </button>
    </form>
  );
}
