import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_URL, requireGeminiKey } from '@/lib/gemini';
import type { ShortTermGoal } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    requireGeminiKey();

    const { fileUrl } = await req.json();
    if (!fileUrl || typeof fileUrl !== 'string') {
      return NextResponse.json({ error: 'fileUrl is required' }, { status: 400 });
    }

    // Firebase Storage の download URL からPDFを取得
    const pdfRes = await fetch(fileUrl);
    if (!pdfRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 400 });
    }
    const pdfBuffer = await pdfRes.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    const body = {
      contents: [{
        parts: [
          {
            text: `この居宅サービス計画書（第2表）から短期目標をすべて抽出してください。

以下のJSON配列形式で返してください。
[
  {
    "goalText": "短期目標のテキスト（例: 家事を継続することができる）",
    "period": "期間（例: R7年7月〜R8年6月）",
    "needs": "関連するニーズ・課題（生活全般の解決すべき課題の欄のテキスト）"
  }
]

注意:
- 短期目標が複数ある場合はすべて含める
- 期間は元の表記を保持する
- 長期目標は含めない
- JSONのみ返す（説明文不要）`,
          },
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // JSON配列を抽出
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse goals from PDF', raw: text }, { status: 500 });
    }

    const goals: ShortTermGoal[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ goals });
  } catch (err) {
    console.error('[gemini/analyze-careplan]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
