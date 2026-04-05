'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { addMonitoringRecord } from '@/lib/firestore';
import type { JigyoshoDocument, ShortTermGoal, GoalAssessment, GoalResult } from '@/lib/types';

const GOAL_RESULT_COLORS: Record<GoalResult, string> = {
  '達成': 'bg-green-100 text-green-700 border-green-300',
  '継続中': 'bg-blue-100 text-blue-700 border-blue-300',
  '一部達成': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  '未達成': 'bg-red-100 text-red-700 border-red-300',
  '変更必要': 'bg-purple-100 text-purple-700 border-purple-300',
};

const GOAL_RESULTS: GoalResult[] = ['達成', '継続中', '一部達成', '未達成', '変更必要'];
const METHODS: MonitoringRecord['method'][] = ['訪問', '電話', 'オンライン'];

// Web Speech API の型宣言
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

interface MonitoringRecord {
  method: '訪問' | '電話' | 'オンライン';
}

interface Props {
  jigyoshoId: string;
  jigyoshoName: string;
  carePlanDocuments: JigyoshoDocument[];  // カテゴリ='居宅サービス計画書' のもの
  onAdded: () => void;
}

export function MonitoringForm({ jigyoshoId, jigyoshoName, carePlanDocuments, onAdded }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [method, setMethod] = useState<'訪問' | '電話' | 'オンライン'>('訪問');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [goals, setGoals] = useState<ShortTermGoal[]>([]);
  const [assessments, setAssessments] = useState<GoalAssessment[]>([]);
  const [overallAssessment, setOverallAssessment] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextDate, setNextDate] = useState('');

  const [loadingGoals, setLoadingGoals] = useState(false);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // 最新の計画書を自動選択
  useEffect(() => {
    if (carePlanDocuments.length > 0 && !selectedDocId) {
      setSelectedDocId(carePlanDocuments[0].id);
    }
  }, [carePlanDocuments, selectedDocId]);

  // Web Speech API の対応確認
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  // 計画書を選択したとき短期目標を自動取得
  useEffect(() => {
    if (!selectedDocId || !open) return;
    const doc = carePlanDocuments.find((d) => d.id === selectedDocId);
    if (!doc) return;
    fetchGoals(doc.fileUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocId, open]);

  const fetchGoals = async (fileUrl: string) => {
    setLoadingGoals(true);
    setGoals([]);
    setAssessments([]);
    try {
      const res = await fetch('/api/gemini/analyze-careplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setGoals(data.goals ?? []);
    } catch {
      alert('計画書の解析に失敗しました。PDFが正しく登録されているか確認してください。');
    } finally {
      setLoadingGoals(false);
    }
  };

  // 音声録音開始/停止
  const toggleRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = transcript;

    recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
      let interim = '';
      for (let i = event.results.length - 1; i >= 0; i--) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
          break;
        } else {
          interim = event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + (interim ? `（${interim}）` : ''));
    };

    recognition.onend = () => {
      setTranscript(finalTranscript);
      setRecording(false);
    };

    recognition.onerror = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  // AI達成判定
  const handleAssess = async () => {
    if (!transcript.trim() || goals.length === 0) return;
    setLoadingAssessment(true);
    try {
      const res = await fetch('/api/gemini/monitoring-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, goals }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAssessments(data.assessments ?? []);
    } catch {
      alert('AI判定に失敗しました');
    } finally {
      setLoadingAssessment(false);
    }
  };

  const updateAssessment = (idx: number, updates: Partial<GoalAssessment>) => {
    setAssessments((prev) => prev.map((a, i) => (i === idx ? { ...a, ...updates } : a)));
  };

  const handleSave = async () => {
    if (!user || !selectedDocId || assessments.length === 0) return;
    const doc = carePlanDocuments.find((d) => d.id === selectedDocId);
    if (!doc) return;
    setSaving(true);
    try {
      await addMonitoringRecord({
        jigyoshoId,
        jigyoshoName,
        carePlanDocumentId: selectedDocId,
        carePlanDocumentTitle: doc.title,
        date,
        method,
        voiceTranscript: transcript,
        goalAssessments: assessments,
        overallAssessment,
        nextAction: nextAction || undefined,
        nextDate: nextDate || undefined,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || '',
      });
      setOpen(false);
      setTranscript('');
      setGoals([]);
      setAssessments([]);
      setOverallAssessment('');
      setNextAction('');
      setNextDate('');
      onAdded();
    } catch {
      alert('保存に失敗しました');
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
        モニタリング記録を追加
      </button>
    );
  }

  const selectedDoc = carePlanDocuments.find((d) => d.id === selectedDocId);

  return (
    <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">モニタリング記録を追加</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 日付・手段 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">日付</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">手段</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* 計画書選択 */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          居宅サービス計画書
          {carePlanDocuments.length === 0 && (
            <span className="text-red-500 ml-1">（書類タブから計画書をアップロードしてください）</span>
          )}
        </label>
        {carePlanDocuments.length > 0 ? (
          <select value={selectedDocId} onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            {carePlanDocuments.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">計画書が登録されていません</p>
        )}
      </div>

      {/* 短期目標の表示 */}
      {loadingGoals && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 rounded-lg p-3">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500" />
          計画書から短期目標を読み取り中...
        </div>
      )}
      {goals.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
          <p className="text-xs font-medium text-gray-500">抽出された短期目標 ({goals.length}件)</p>
          {goals.map((g, i) => (
            <div key={i} className="text-xs text-gray-700 flex gap-2">
              <span className="text-blue-500 shrink-0">{i + 1}.</span>
              <span>{g.goalText}<span className="text-gray-400 ml-1">({g.period})</span></span>
            </div>
          ))}
        </div>
      )}

      {/* 音声入力 */}
      {selectedDoc && goals.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs text-gray-500 font-medium block">モニタリング内容（音声または手入力）</label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="ここに内容を入力、または下の録音ボタンで音声入力..."
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          {speechSupported ? (
            <button
              type="button"
              onClick={toggleRecording}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                recording
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill={recording ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {recording ? '録音中... タップで停止' : '音声録音を開始'}
            </button>
          ) : (
            <p className="text-xs text-gray-400 text-center">このブラウザは音声入力に対応していません。テキストで入力してください。</p>
          )}

          {transcript.trim() && (
            <button
              type="button"
              onClick={handleAssess}
              disabled={loadingAssessment}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loadingAssessment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  AI判定中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AIで短期目標ごとに達成状況を判定
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* AI判定結果 */}
      {assessments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-700">AI判定結果（修正可能）</h4>
          {assessments.map((a, idx) => (
            <div key={idx} className="border border-gray-100 rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-gray-800">{idx + 1}. {a.goalText}</p>
              <p className="text-xs text-gray-400">{a.period}</p>

              {/* 判定結果ボタン */}
              <div className="flex gap-1 flex-wrap">
                {GOAL_RESULTS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => updateAssessment(idx, { result: r })}
                    className={`text-xs px-2 py-1 rounded-full border transition font-medium ${
                      a.result === r
                        ? GOAL_RESULT_COLORS[r]
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* AI根拠 */}
              {a.aiReason && (
                <p className="text-xs text-gray-500 bg-blue-50 rounded p-1.5">
                  <span className="font-medium text-blue-600">AI根拠:</span> {a.aiReason}
                </p>
              )}

              {/* コメント入力 */}
              <input
                type="text"
                value={a.comment}
                onChange={(e) => updateAssessment(idx, { comment: e.target.value })}
                placeholder="コメントを追加（任意）"
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          ))}

          {/* 総合所見 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">総合所見</label>
            <textarea
              value={overallAssessment}
              onChange={(e) => setOverallAssessment(e.target.value)}
              placeholder="全体的な状況・特記事項など"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          {/* 次回アクション */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">次回アクション</label>
              <input type="text" value={nextAction} onChange={(e) => setNextAction(e.target.value)}
                placeholder="例: ケアプラン見直し"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">次回予定日</label>
              <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            {saving ? '保存中...' : '記録を保存'}
          </button>
        </div>
      )}
    </div>
  );
}
