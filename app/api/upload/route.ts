import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseEnv } from '@/lib/api';
import { categorise } from '@/lib/categoriser';
import { parseStatementPdf } from '@/lib/statement-parser';
import { supabaseAdmin } from '@/lib/supabase';
import { Account } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const envError = requireSupabaseEnv();
  if (envError) return envError;

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

  const parsed = await parseStatementPdf(file);
  const { data: accounts, error: accountError } = await supabaseAdmin
    .from('accounts')
    .select('id, institution')
    .returns<Array<Pick<Account, 'id' | 'institution'>>>();

  if (accountError) return NextResponse.json({ error: accountError.message }, { status: 500 });

  const accountId = accounts?.find((account) => account.institution === parsed.account_institution)?.id;
  if (!accountId) {
    return NextResponse.json({ error: `Unknown institution: ${parsed.account_institution}` }, { status: 400 });
  }

  let inserted = 0;
  let skipped = 0;

  for (const tx of parsed.transactions) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('date', tx.date)
      .eq('description', tx.description)
      .eq('amount', tx.amount)
      .limit(1);
    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
    if (existing && existing.length > 0) {
      skipped += 1;
      continue;
    }

    const category = categorise(tx.description);
    const { error } = await supabaseAdmin.from('transactions').insert({
      account_id: accountId,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      direction: tx.direction,
      ...category,
      source_file: tx.source_file
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    inserted += 1;
  }

  return NextResponse.json({
    inserted,
    skipped,
    detected: parsed.account_institution,
    errors: parsed.parse_errors
  });
}
