'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AppLayout } from '@/components/AppLayout';
import { ActionButtons } from '@/components/ActionButtons';
import { NoteForm } from '@/components/NoteForm';
import { NoteList } from '@/components/NoteList';
import { ContactList } from '@/components/ContactList';
import { VisitLogForm } from '@/components/VisitLogForm';
import { VisitLogList } from '@/components/VisitLogList';
import { DocumentManager } from '@/components/DocumentManager';
import { JigyoshoStatusPanel } from '@/components/JigyoshoStatusPanel';
import { OcrModal } from '@/components/OcrModal';
import { MonitoringForm } from '@/components/MonitoringForm';
import { MonitoringList } from '@/components/MonitoringList';
import { fetchJigyoshoList, buildAddress, googleMapsEmbedUrl } from '@/lib/master-api';
import { getNotes, getVisitLogs, getContacts, getDocuments, getJigyoshoStatus, getMonitoringRecords } from '@/lib/firestore';
import type { Jigyosho, JigyoshoNote, VisitLog, Contact, JigyoshoDocument, JigyoshoStatus, MonitoringRecord } from '@/lib/types';

type TabKey = 'crm' | 'monitoring' | 'docs' | 'notes';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'crm', label: '営業・担当者' },
  { key: 'monitoring', label: 'モニタリング' },
  { key: 'docs', label: '書類' },
  { key: 'notes', label: 'メモ' },
];

export default function JigyoshoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const decodedId = decodeURIComponent(id);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jigyosho, setJigyosho] = useState<Jigyosho | null>(null);
  const [notes, setNotes] = useState<JigyoshoNote[]>([]);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [documents, setDocuments] = useState<JigyoshoDocument[]>([]);
  const [monitoringRecords, setMonitoringRecords] = useState<MonitoringRecord[]>([]);
  const [status, setStatus] = useState<JigyoshoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('crm');
  const [ocrContactId, setOcrContactId] = useState<string | null>(null);

  const jigyoshoKey = jigyosho?.統合事業所ID || jigyosho?.id || decodedId;

  const loadData = useCallback(async (key: string) => {
    const [n, v, c, d, s, m] = await Promise.all([
      getNotes(key),
      getVisitLogs(key),
      getContacts(key),
      getDocuments(key),
      getJigyoshoStatus(key),
      getMonitoringRecords(key),
    ]);
    setNotes(n);
    setVisitLogs(v);
    setContacts(c);
    setDocuments(d);
    setStatus(s);
    setMonitoringRecords(m);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (!user) return;

    (async () => {
      try {
        const res = await fetchJigyoshoList({ limit: 1000 });
        const found = res.data.find((j) => j.id === decodedId);
        if (found) {
          setJigyosho(found);
          await loadData(found.統合事業所ID || found.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router, decodedId, loadData]);

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
        </div>
      </AppLayout>
    );
  }

  if (!jigyosho) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <p className="text-gray-500">事業所が見つかりません</p>
          <button onClick={() => router.back()} className="text-[var(--color-primary)] text-sm hover:underline">
            戻る
          </button>
        </div>
      </AppLayout>
    );
  }

  const address = buildAddress(jigyosho);

  return (
    <AppLayout>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 space-y-4">
        {/* 戻るボタン */}
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          一覧に戻る
        </button>

        {/* 基本情報カード */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div>
            <h1 className="text-lg font-bold">{jigyosho.名称}</h1>
            {jigyosho.正式名称 && jigyosho.正式名称 !== jigyosho.名称 && (
              <p className="text-sm text-gray-500">{jigyosho.正式名称}</p>
            )}
            {jigyosho.事業所番号 && (
              <p className="text-xs text-gray-400 mt-1">事業所番号: {jigyosho.事業所番号}</p>
            )}
          </div>

          {address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{jigyosho['住所_郵便番号'] && `〒${jigyosho['住所_郵便番号']} `}{address}</span>
            </div>
          )}

          {jigyosho.TEL && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>TEL: {jigyosho.TEL}</span>
            </div>
          )}

          {jigyosho.FAX && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>FAX: {jigyosho.FAX}</span>
            </div>
          )}

          {jigyosho.eメール && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{jigyosho.eメール}</span>
            </div>
          )}

          {jigyosho.HomePage && (
            <a
              href={jigyosho.HomePage.startsWith('http') ? jigyosho.HomePage : `https://${jigyosho.HomePage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              ホームページ
            </a>
          )}
        </div>

        {/* 地図 */}
        {address && (
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: 220 }}>
            <iframe
              src={googleMapsEmbedUrl(jigyosho)}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {/* アクションボタン */}
        <ActionButtons jigyosho={jigyosho} />

        {/* ステータスパネル */}
        <JigyoshoStatusPanel
          jigyoshoId={jigyoshoKey}
          jigyoshoName={jigyosho.名称}
          status={status}
          onChanged={() => loadData(jigyoshoKey)}
        />

        {/* タブ */}
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.key
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'crm' && (
          <div className="space-y-5">
            <div className="space-y-3">
              <h2 className="font-bold text-sm text-gray-700">担当者</h2>
              <ContactList
                jigyoshoId={jigyoshoKey}
                contacts={contacts}
                onChanged={() => loadData(jigyoshoKey)}
                onOcrRequest={(contactId) => setOcrContactId(contactId)}
              />
            </div>
            <div className="space-y-3">
              <h2 className="font-bold text-sm text-gray-700">営業記録</h2>
              <VisitLogForm
                jigyoshoId={jigyoshoKey}
                jigyoshoName={jigyosho.名称}
                contacts={contacts}
                onAdded={() => loadData(jigyoshoKey)}
              />
              <VisitLogList
                logs={visitLogs}
                onDeleted={() => loadData(jigyoshoKey)}
                currentUserId={user?.uid}
              />
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-gray-700">モニタリング記録</h2>
            <MonitoringForm
              jigyoshoId={jigyoshoKey}
              jigyoshoName={jigyosho.名称}
              carePlanDocuments={documents.filter((d) => d.category === '居宅サービス計画書')}
              onAdded={() => loadData(jigyoshoKey)}
            />
            <MonitoringList
              records={monitoringRecords}
              onDeleted={() => loadData(jigyoshoKey)}
              currentUserId={user?.uid}
            />
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-gray-700">書類管理</h2>
            <DocumentManager
              jigyoshoId={jigyoshoKey}
              documents={documents}
              onChanged={() => loadData(jigyoshoKey)}
            />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-gray-700">メモ・資料</h2>
            <NoteForm jigyoshoId={jigyoshoKey} onAdded={() => loadData(jigyoshoKey)} />
            <NoteList notes={notes} onDeleted={() => loadData(jigyoshoKey)} />
          </div>
        )}
      </main>

      {/* OCRモーダル */}
      {ocrContactId && (
        <OcrModal
          contactId={ocrContactId}
          jigyoshoId={jigyoshoKey}
          onClose={() => setOcrContactId(null)}
          onUpdated={() => { setOcrContactId(null); loadData(jigyoshoKey); }}
        />
      )}
    </AppLayout>
  );
}
