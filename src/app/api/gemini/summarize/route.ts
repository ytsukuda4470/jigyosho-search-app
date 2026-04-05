import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_URL, requireGeminiKey, MAX_NAME_LENGTH } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    requireGeminiKey();

    const { url, jigyoshoName } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }
    // https:// のみ許可
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    if (parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only https URLs are allowed' }, { status: 400 });
    }

    const safeName = (jigyoshoName ?? '').slice(0, MAX_NAME_LENGTH).replace(/[`"\\]/g, '');

    const body = {
      contents: [{
        parts: [{
          text: `介護・福祉事業所「${safeName}」のウェブサイト ${parsed.href} の内容を100文字以内で要約してください。サービス内容・特徴・対象者などを中心に簡潔にまとめてください。`,
        }],
      }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
    };

    const res = await fetch(GEMINI_URL(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }

    const data = await res.json();
    const summary = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
    return NextResponse.json({ summary });
  } catch (err) {
    console.error('[gemini/summarize]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
