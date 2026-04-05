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
