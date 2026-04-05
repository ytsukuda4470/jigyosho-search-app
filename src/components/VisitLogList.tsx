'use client';

import { deleteVisitLog } from '@/lib/firestore';
import type { VisitLog } from '@/lib/types';

const METHOD_COLORS: Record<string, string> = {
  訪問: 'bg-green-100 text-green-700',
  電話: 'bg-blue-100 text-blue-700',
  メール: 'bg-orange-100 text-orange-700',
  FAX: 'bg-purple-100 text-purple-700',
  オンライン: 'bg-cyan-100 text-cyan-700',
  その他: 'bg-gray-100 text-gray-600',
};

interface Props {
  logs: VisitLog[];
  onDeleted: () => void;
  currentUserId?: string;
}

export function VisitLogList({ logs, onDeleted, currentUserId }: Props) {
  if (logs.length === 0) {
    return <p className="text-center text-gray-400 py-6 text-sm">営業記録はまだありません</p>;
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この記録を削除しますか？')) return;
    await deleteVisitLog(id);
    onDeleted();
  };

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800">{log.date}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLORS[log.method] || METHOD_COLORS['その他']}`}>
                {log.method}
              </span>
              {log.contact && (
                <span className="text-xs text-gray-500">{log.contact}</span>
              )}
            </div>
            {currentUserId === log.createdBy && (
              <button onClick={() => handleDelete(log.id)} className="text-gray-300 hover:text-red-400 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-wrap">{log.content}</p>

          {(log.nextAction || log.nextDate) && (
            <div className="flex items-center gap-2 bg-yellow-50 rounded-lg px-3 py-2 text-xs">
              <svg className="w-3.5 h-3.5 text-yellow-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-yellow-800 font-medium">
                {log.nextDate && `${log.nextDate} `}{log.nextAction}
              </span>
            </div>
          )}

          <p className="text-xs text-gray-400">{log.createdByName}</p>
        </div>
      ))}
    </div>
  );
}
