import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_URL, requireGeminiKey, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BASE64_LENGTH } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    requireGeminiKey();

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'imageBase64 and mimeType are required' }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }
    if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
    }

    const body = {
      contents: [{
        parts: [
          {
            text: `この名刺画像から情報を抽出してください。以下のJSON形式で返答してください。存在しない項目はnullにしてください。
{
  "name": "氏名",
  "nameKana": "フリガナ（あれば）",
  "title": "役職",
  "department": "部署",
  "tel": "電話番号（固定）",
  "mobile": "携帯電話番号",
  "email": "メールアドレス",
  "memo": "その他特記事項"
}
JSONのみ返してください。`,
          },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
    };

    const res = await fetch(GEMINI_URL(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse OCR result' }, { status: 500 });
    }
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('[gemini/ocr]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
