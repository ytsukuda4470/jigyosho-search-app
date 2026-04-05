import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
  try {
    const { jigyoshoName } = await req.json();
    if (!jigyoshoName) {
      return NextResponse.json({ error: 'jigyoshoName is required' }, { status: 400 });
    }

    const body = {
      contents: [{
        parts: [{
          text: `日本の介護・福祉事業所「${jigyoshoName}」の公式ウェブサイトURLを教えてください。
URLのみ返してください。見つからない場合は "null" とだけ返してください。
例: https://example.com`,
        }],
      }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
    };

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
    const urlMatch = text.match(/https?:\/\/[^\s"'<>]+/);
    const url = urlMatch ? urlMatch[0] : null;
    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
