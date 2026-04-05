import { NextRequest } from 'next/server';

const API_BASE = 'https://asia-northeast1-tougou-db-f9f9e.cloudfunctions.net';
const API_KEY = process.env.MASTER_API_KEY || '279-master-api-2026';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams();

  for (const key of ['search', 'kyoten', 'limit', 'offset']) {
    const val = searchParams.get(key);
    if (val) params.set(key, val);
  }

  const url = `${API_BASE}/getJigyosho${params.toString() ? `?${params}` : ''}`;

  const res = await fetch(url, {
    headers: { 'x-api-key': API_KEY },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return Response.json({ error: '事業所データの取得に失敗しました' }, { status: res.status });
  }

  const data = await res.json();
  return Response.json(data);
}
