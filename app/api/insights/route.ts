import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireSupabaseEnv } from '@/lib/api';
import { currentMonthKey } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const envError = requireSupabaseEnv();
  if (envError) return envError;
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is missing.' }, { status: 503 });

  const month = currentMonthKey();
  const [hist, cats, debts] = await Promise.all([
    supabase.from('monthly_summary').select('*').order('month', { ascending: false }).limit(3),
    supabase.from('category_summary').select('*').eq('month', month),
    supabase.from('debts').select('*').eq('status', 'active')
  ]);

  const error = hist.error ?? cats.error ?? debts.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const anthropic = new Anthropic();
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `You are a blunt personal finance advisor for a Malaysian SME founder earning RM5,000/month.
Give exactly 3 short actionable insights referencing real numbers. No fluff.
Monthly data: ${JSON.stringify(hist.data)}
This month categories: ${JSON.stringify(cats.data)}
Active debts: ${JSON.stringify(debts.data)}`
      }
    ]
  });

  const first = msg.content[0];
  const text = first?.type === 'text' ? first.text : '';
  return NextResponse.json({ insights: text });
}
