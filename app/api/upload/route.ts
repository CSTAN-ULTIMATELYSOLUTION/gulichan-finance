import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseEnv } from '@/lib/api';
import { categorise } from '@/lib/categoriser';
import { supabaseAdmin } from '@/lib/supabase';
import { Account, ParseResult } from '@/lib/types';

export const runtime = 'nodejs';

function parserServiceUrl() {
  return process.env.PARSER_SERVICE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8001';
}

function parserErrorMessage(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { detail?: unknown; error?: unknown };
    return String(parsed.detail ?? parsed.error ?? raw);
  } catch {
    return raw;
  }
}

async function parseWithService(file: File): Promise<ParseResult | NextResponse> {
  const parserForm = new FormData();
  parserForm.append('file', file);

  const baseUrl = parserServiceUrl();
  try {
    const parserRes = await fetch(`${baseUrl}/parse`, { method: 'POST', body: parserForm });
    const text = await parserRes.text();
    if (!parserRes.ok) {
      return NextResponse.json({ error: `Parser service error: ${parserErrorMessage(text)}` }, { status: 500 });
    }
    return JSON.parse(text) as ParseResult;
  } catch {
    return NextResponse.json(
      {
        error: `Cannot reach parser service at ${baseUrl}. Start it with: cd parser-service && uvicorn main:app --port 8001 --reload`
      },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  const envError = requireSupabaseEnv();
  if (envError) return envError;

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Only PDF files accepted.' }, { status: 400 });
  }

  const parsed = await parseWithService(file);
  if (parsed instanceof NextResponse) return parsed;

  if (!parsed.transactions || parsed.transactions.length === 0) {
    return NextResponse.json({
      inserted: 0,
      skipped: 0,
      detected: parsed.account_institution,
      institution: parsed.account_institution,
      statement_month: parsed.statement_month,
      total_parsed: 0,
      warning: 'No transactions extracted. Use /debug on the parser service to inspect raw PDF text.',
      errors: parsed.parse_errors
    });
  }

  const { data: accounts, error: accountError } = await supabaseAdmin
    .from('accounts')
    .select('id, institution')
    .returns<Array<Pick<Account, 'id' | 'institution'>>>();

  if (accountError) return NextResponse.json({ error: accountError.message }, { status: 500 });

  const accountId = accounts?.find((account) => account.institution === parsed.account_institution)?.id;
  if (!accountId) {
    return NextResponse.json(
      { error: `No account found for institution: "${parsed.account_institution}". Add it to the accounts table.` },
      { status: 400 }
    );
  }

  let inserted = 0;
  let skipped = 0;
  const insertErrors: string[] = [];

  for (const tx of parsed.transactions) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('date', tx.date)
      .eq('description', tx.description)
      .eq('amount', tx.amount)
      .limit(1);
    if (existingError) {
      insertErrors.push(`${tx.date} ${tx.description}: ${existingError.message}`);
      continue;
    }
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
    if (error) {
      insertErrors.push(`${tx.date} ${tx.description}: ${error.message}`);
    } else {
      inserted += 1;
    }
  }

  return NextResponse.json({
    institution: parsed.account_institution,
    statement_month: parsed.statement_month,
    inserted,
    skipped,
    total_parsed: parsed.transactions.length,
    detected: parsed.account_institution,
    errors: [...parsed.parse_errors, ...insertErrors]
  });
}
