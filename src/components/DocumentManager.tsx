'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { addDocument, deleteDocument } from '@/lib/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from '@/lib/firebase';
import type { JigyoshoDocument, DocumentCategory } from '@/lib/types';

const CATEGORIES: DocumentCategory[] = ['居宅サービス計画書', '加算シート', '契約書', 'パンフレット', '報告書', 'その他'];

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  '居宅サービス計画書': 'bg-blue-100 text-blue-700',
  '加算シート': 'bg-purple-100 text-purple-700',
  '契約書': 'bg-blue-100 text-blue-700',
  'パンフレット': 'bg-green-100 text-green-700',
  '報告書': 'bg-orange-100 text-orange-700',
  'その他': 'bg-gray-100 text-gray-600',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

interface Props {
  jigyoshoId: string;
  documents: JigyoshoDocument[];
  onChanged: () => void;
}

export function DocumentManager({ jigyoshoId, documents, onChanged }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('居宅サービス計画書');
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    setShowForm(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;
    setUploading(true);
    setProgress(0);
    try {
      const timestamp = Date.now();
      const path = `jigyosho_documents/${jigyoshoId}/${timestamp}_${selectedFile.name}`;
      const storageRef = ref(getFirebaseStorage(), path);
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, selectedFile);
        task.on('state_changed',
          (snap) => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
          reject,
          () => resolve()
        );
      });
      const fileUrl = await getDownloadURL(storageRef);
      await addDocument({
        jigyoshoId,
        category,
        title: title || selectedFile.name,
        fileUrl,
        fileName: selectedFile.name,
        fileMimeType: selectedFile.type,
        fileSize: selectedFile.size,
        memo: memo || undefined,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || '',
      });
      setSelectedFile(null);
      setTitle('');
      setMemo('');
      setShowForm(false);
      onChanged();
    } catch (err) {
      console.error(err);
      alert('アップロードに失敗しました');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (doc: JigyoshoDocument) => {
    if (!confirm(`「${doc.title}」を削除しますか？`)) return;
    await deleteDocument(doc.id);
    onChanged();
  };

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[doc.category]}`}>
                  {doc.category}
                </span>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sm text-gray-800 hover:text-blue-600 truncate"
                >
                  {doc.title}
                </a>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                <span>{doc.fileName}</span>
                {doc.fileSize && <span>{formatBytes(doc.fileSize)}</span>}
              </div>
              {doc.memo && <p className="mt-1 text-xs text-gray-500 italic">{doc.memo}</p>}
              <p className="mt-1 text-xs text-gray-400">{doc.createdByName}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-300 hover:text-blue-500 transition"
                title="開く"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button
                onClick={() => handleDelete(doc)}
                className="p-1.5 text-gray-300 hover:text-red-400 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}

      {showForm && selectedFile ? (
        <form onSubmit={handleUpload} className="bg-white rounded-xl border border-blue-100 p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">書類を登録</h3>
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            {selectedFile.name} ({formatBytes(selectedFile.size)})
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">タイトル <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">メモ</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="備考など"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>アップロード中...</span><span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={uploading || !title.trim()}
              className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {uploading ? `アップロード中 ${progress}%` : '登録'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition">
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          書類をアップロード
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
