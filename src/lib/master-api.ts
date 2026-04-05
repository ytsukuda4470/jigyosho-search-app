import type { Jigyosho, PaginatedResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_MASTER_API_URL || '';

/**
 * 事業所一覧を取得（クライアントサイドから /api/jigyosho 経由）
 */
export async function fetchJigyoshoList(params?: {
  search?: string;
  kyoten?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<Jigyosho>> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.kyoten) sp.set('kyoten', params.kyoten);
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.offset) sp.set('offset', String(params.offset));

  const url = `${BASE_URL}/api/jigyosho${sp.toString() ? `?${sp}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('事業所データの取得に失敗しました');
  return res.json();
}

/**
 * 住所文字列を組み立て
 */
export function buildAddress(j: Jigyosho): string {
  return [j['住所_都道府県'], j['住所_市区町村'], j['住所_その他'], j['住所_その他2']]
    .filter(Boolean)
    .join('');
}

/**
 * Googleマップ検索URL
 */
export function googleMapsUrl(j: Jigyosho): string {
  const address = buildAddress(j);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
