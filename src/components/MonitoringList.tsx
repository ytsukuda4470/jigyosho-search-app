'use client';

import { useState } from 'react';
import { deleteMonitoringRecord } from '@/lib/firestore';
import type { MonitoringRecord, GoalResult } from '@/lib/types';

const RESULT_COLORS: Record<GoalResult, string> = {
  '達成': 'bg-green-100 text-green-700',
  '継続中': 'bg-blue-100 text-blue-700',
  '一部達成': 'bg-yellow-100 text-yellow-700',
  '未達成': 'bg-red-100 text-red-700',
  '変更必要': 'bg-purple-100 text-purple-700',
};

const METHOD_ICONS: Record<string, string> = {
  訪問: '🚗',
  電話: '📞',
  オンライン: '💻',
};

interface Props {
  records: MonitoringRecord[];
  onDeleted: () => void;
  currentUserId?: string;
}

export function MonitoringList({ records, onDeleted, currentUserId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (records.length === 0) {
    return <p className="text-center text-gray-400 py-6 text-sm">モニタリング記録はまだありません</p>;
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このモニタリング記録を削除しますか？')) return;
    await deleteMonitoringRecord(id);
    onDeleted();
  };

  return (
    <div className="space-y-3">
      {records.map((rec) => {
        const isExpanded = expandedId === rec.id;
        return (
          <div key={rec.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* ヘッダー行（常時表示） */}
            <button
              className="w-full text-left p-4 hover:bg-gray-50 transition"
              onClick={() => setExpandedId(isExpanded ? null : rec.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{rec.date}</span>
                  <span className="text-sm">{METHOD_ICONS[rec.method] ?? '📋'}</span>
                  <span className="text-xs text-gray-500 truncate">{rec.carePlanDocumentTitle}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* 達成サマリーバッジ */}
                  {rec.goalAssessments.length > 0 && (
                    <div className="flex gap-1">
                      {['達成', '継続中', '一部達成', '未達成', '変更必要'].map((r) => {
                        const count = rec.goalAssessments.filter((a) => a.result === r).length;
                        if (count === 0) return null;
                        return (
                          <span key={r} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${RESULT_COLORS[r as GoalResult]}`}>
                            {r.slice(0, 2)}{count}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* 展開コンテンツ */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                {/* 短期目標別判定 */}
                {rec.goalAssessments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">短期目標別達成状況</p>
                    {rec.goalAssessments.map((a, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${RESULT_COLORS[a.result]}`}>
                          {a.result}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700">{a.goalText}</p>
                          {a.aiReason && (
                            <p className="text-xs text-gray-400 mt-0.5">{a.aiReason}</p>
                          )}
                          {a.comment && (
                            <p className="text-xs text-gray-600 italic mt-0.5">{a.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 総合所見 */}
                {rec.overallAssessment && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">総合所見</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{rec.overallAssessment}</p>
                  </div>
                )}

                {/* 音声文字起こし（折りたたみ） */}
                {rec.voiceTranscript && (
                  <details className="text-xs">
                    <summary className="text-gray-400 cursor-pointer hover:text-gray-600">音声記録（文字起こし）を表示</summary>
                    <p className="mt-1 text-gray-600 whitespace-pre-wrap bg-gray-50 rounded p-2">{rec.voiceTranscript}</p>
                  </details>
                )}

                {/* 次回アクション */}
                {(rec.nextAction || rec.nextDate) && (
                  <div className="flex items-center gap-2 bg-yellow-50 rounded-lg px-3 py-2 text-xs">
                    <svg className="w-3.5 h-3.5 text-yellow-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-yellow-800 font-medium">
                      {rec.nextDate && `${rec.nextDate} `}{rec.nextAction}
                    </span>
                  </div>
                )}

                {/* フッター */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-gray-400">{rec.createdByName}</p>
                  {currentUserId === rec.createdBy && (
                    <button onClick={() => handleDelete(rec.id)} className="text-gray-300 hover:text-red-400 transition p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
