'use client';

import { useState } from 'react';
import type { JigyoshoNote } from '@/lib/types';
import { NOTE_TYPE_LABELS, NOTE_TYPE_ICONS } from '@/lib/types';
import { deleteNote } from '@/lib/firestore';

interface Props {
  notes: JigyoshoNote[];
  onDeleted: () => void;
}

export function NoteList({ notes, onDeleted }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (noteId: string) => {
    if (!confirm('この情報を削除しますか？')) return;
    setDeleting(noteId);
    try {
      await deleteNote(noteId);
      onDeleted();
    } catch {
      alert('削除に失敗しました');
    } finally {
      setDeleting(null);
    }
  };

  if (notes.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400 py-8">
        追加情報はまだありません
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div key={note.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">{NOTE_TYPE_ICONS[note.type]}</span>
              <div className="min-w-0">
                <h4 className="font-medium text-sm truncate">{note.title}</h4>
                <span className="text-xs text-gray-400">
                  {NOTE_TYPE_LABELS[note.type]} / {note.createdByName}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(note.id)}
              disabled={deleting === note.id}
              className="text-gray-300 hover:text-red-500 transition shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {note.content && note.type !== 'url' && (
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
              {note.content}
            </p>
          )}

          {/* URL / ドライブリンク */}
          {(note.type === 'url' || note.driveUrl) && (
            <a
              href={note.content || note.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline truncate max-w-full"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="truncate">{note.content || note.driveUrl}</span>
            </a>
          )}

          {/* ファイル */}
          {note.fileUrl && (
            <a
              href={note.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
            >
              {note.fileMimeType?.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={note.fileUrl}
                  alt={note.fileName || '写真'}
                  className="w-full max-w-xs rounded-lg mt-1"
                />
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {note.fileName || 'ファイルを開く'}
                </>
              )}
            </a>
          )}

          <p className="mt-2 text-xs text-gray-300">
            {note.createdAt.toLocaleDateString('ja-JP')}
          </p>
        </div>
      ))}
    </div>
  );
}
