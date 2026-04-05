/**
 * 279統合DB 事業所マスタ型定義
 */
export interface Jigyosho {
  id: string;
  統合事業所ID: string;
  事業所番号: string;
  名称: string;
  '名称_ｶﾅ': string;
  正式名称: string;
  '住所_郵便番号': string;
  '住所_都道府県': string;
  '住所_市区町村': string;
  '住所_その他': string;
  '住所_その他2': string;
  TEL: string;
  FAX: string;
  eメール: string;
  HomePage: string;
  有効フラグ: string;
  [key: string]: string;
}

/**
 * 追加情報の種別
 */
export type NoteType = 'memo' | 'pamphlet' | 'url' | 'photo' | 'document' | 'other';

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  memo: 'メモ',
  pamphlet: 'パンフレット',
  url: 'URL・リンク',
  photo: '写真',
  document: '資料',
  other: 'その他',
};

export const NOTE_TYPE_ICONS: Record<NoteType, string> = {
  memo: '📝',
  pamphlet: '📄',
  url: '🔗',
  photo: '📷',
  document: '📁',
  other: '📌',
};

/**
 * Firestore: 事業所追加情報
 */
export interface JigyoshoNote {
  id: string;
  jigyoshoId: string;
  type: NoteType;
  title: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  driveUrl?: string;
  tags?: string[];
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firestore: 営業記録（訪問・電話・メール等）
 */
export type VisitMethod = '訪問' | '電話' | 'メール' | 'FAX' | 'オンライン' | 'その他';

export interface VisitLog {
  id: string;
  jigyoshoId: string;
  jigyoshoName: string;
  date: string;            // YYYY-MM-DD
  method: VisitMethod;
  contact: string;         // 対応者名
  content: string;         // 内容
  nextAction?: string;     // 次回アクション
  nextDate?: string;       // 次回予定日 YYYY-MM-DD
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firestore: 担当者
 */
export type ContactStatus = '在職' | '退職' | '異動';

export interface Contact {
  id: string;
  jigyoshoId: string;
  name: string;
  nameKana?: string;
  title: string;           // 役職
  department?: string;     // 部署
  tel?: string;
  mobile?: string;
  email?: string;
  status: ContactStatus;
  statusNote?: string;     // 退職・異動先メモ
  statusDate?: string;     // 退職・異動日
  memo?: string;
  businessCardUrl?: string; // 名刺画像URL（Storage）
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firestore: 書類（加算シート・契約書等）
 */
export type DocumentCategory = '居宅サービス計画書' | '加算シート' | '契約書' | 'パンフレット' | '報告書' | 'その他';

export interface JigyoshoDocument {
  id: string;
  jigyoshoId: string;
  category: DocumentCategory;
  title: string;
  fileUrl: string;
  fileName: string;
  fileMimeType: string;
  fileSize?: number;
  memo?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firestore: 事業所ステータス（関係度・WEBサイト等）
 */
export type RelationStatus = '未接触' | '接触済' | '取引中' | '休眠';

export interface JigyoshoStatus {
  jigyoshoId: string;
  relationStatus: RelationStatus;
  websiteUrl?: string;      // Geminiで自動取得 or 手動登録
  websiteSummary?: string;  // GeminiによるWEBサイト要約
  websiteUpdatedAt?: Date;
  starred: boolean;
  assignedTo?: string;      // 担当者UID
  updatedBy: string;
  updatedAt: Date;
}

/**
 * Firestore: モニタリング記録
 */
export type GoalResult = '達成' | '継続中' | '一部達成' | '未達成' | '変更必要';

export interface ShortTermGoal {
  goalText: string;       // 短期目標のテキスト
  period: string;         // 期間（例: R7年7月〜R8年6月）
  needs?: string;         // 関連するニーズ（第2表の課題）
}

export interface GoalAssessment {
  goalText: string;
  period: string;
  result: GoalResult;
  aiReason: string;       // AIの判定根拠
  comment: string;        // ケアマネのコメント（手動入力）
}

export interface MonitoringRecord {
  id: string;
  jigyoshoId: string;
  jigyoshoName: string;
  carePlanDocumentId: string;     // 使用した計画書のドキュメントID
  carePlanDocumentTitle: string;  // 計画書のタイトル（表示用）
  date: string;                   // YYYY-MM-DD
  method: '訪問' | '電話' | 'オンライン';
  voiceTranscript: string;        // 音声の文字起こし
  goalAssessments: GoalAssessment[];
  overallAssessment: string;      // 総合所見
  nextAction?: string;
  nextDate?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API レスポンス
 */
export interface PaginatedResponse<T> {
  collection: string;
  total: number;
  count: number;
  offset: number;
  limit: number;
  kyoten: string | null;
  search: string | null;
  data: T[];
  fetchedAt: string;
}
