import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_URL, requireGeminiKey } from '@/lib/gemini';
import type { ShortTermGoal, GoalAssessment, GoalResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    requireGeminiKey();

    const { transcript, goals } = await req.json() as {
      transcript: string;
      goals: ShortTermGoal[];
    };

    if (!transcript || !Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json({ error: 'transcript and goals are required' }, { status: 400 });
    }
    if (transcript.length > 10000) {
      return NextResponse.json({ error: 'Transcript too long' }, { status: 400 });
    }

    const goalsText = goals
      .map((g, i) => `${i + 1}. 「${g.goalText}」（期間: ${g.period}）`)
      .join('\n');

    const body = {
      contents: [{
        parts: [{
          text: `あなたはケアマネジャーの支援専門家です。
以下のモニタリング記録（音声から文字起こし）をもとに、各短期目標の達成状況を評価してください。

【モニタリング記録（文字起こし）】
${transcript}

【評価対象の短期目標】
${goalsText}

以下のJSON配列で各目標の評価を返してください。
resultは必ず「達成」「継続中」「一部達成」「未達成」「変更必要」のいずれかにしてください。
aiReasonは文字起こしの内容を根拠として50文字以内で記述してください。
文字起こしに関連する情報がない場合は「記録に記載なし」とし、resultは「継続中」としてください。

[
  {
    "goalText": "短期目標のテキスト（元の文言をそのまま使用）",
    "period": "期間",
    "result": "達成|継続中|一部達成|未達成|変更必要",
    "aiReason": "判定根拠（50文字以内）",
    "comment": ""
  }
]

JSONのみ返してください。`,
        }],
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
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

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse assessment', raw: text }, { status: 500 });
    }

    const assessments: GoalAssessment[] = JSON.parse(jsonMatch[0]);

    // result の値を検証・補正
    const validResults: GoalResult[] = ['達成', '継続中', '一部達成', '未達成', '変更必要'];
    const safe = assessments.map((a) => ({
      ...a,
      result: validResults.includes(a.result) ? a.result : '継続中' as GoalResult,
      comment: '',
    }));

    return NextResponse.json({ assessments: safe });
  } catch (err) {
    console.error('[gemini/monitoring-assessment]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
