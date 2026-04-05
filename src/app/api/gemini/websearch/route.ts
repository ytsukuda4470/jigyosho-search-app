import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_URL, requireGeminiKey, MAX_NAME_LENGTH } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    requireGeminiKey();

    const { jigyoshoName } = await req.json();
    if (!jigyoshoName || typeof jigyoshoName !== 'string') {
      return NextResponse.json({ error: 'jigyoshoName is required' }, { status: 400 });
    }
    const safeName = jigyoshoName.slice(0, MAX_NAME_LENGTH).replace(/[`"\\]/g, '');

    const body = {
      contents: [{
        parts: [{
          text: `日本の介護・福祉事業所「${safeName}」の公式ウェブサイトURLを教えてください。\nURLのみ返してください。見つからない場合は "null" とだけ返してください。\n例: https://example.com`,
        }],
      }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
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
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
    const urlMatch = text.match(/https?:\/\/[^\s"'<>]+/);
    return NextResponse.json({ url: urlMatch ? urlMatch[0] : null });
  } catch (err) {
    console.error('[gemini/websearch]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
