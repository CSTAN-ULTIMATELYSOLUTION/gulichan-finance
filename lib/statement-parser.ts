import { PDFParse } from 'pdf-parse';
import { ParseResult, TransactionDirection } from './types';

function parseDate(value: string) {
  const trimmed = value.trim();
  const slash = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
  if (slash) {
    const day = slash[1].padStart(2, '0');
    const month = slash[2].padStart(2, '0');
    const rawYear = slash[3];
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year}-${month}-${day}`;
  }

  const named = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2}|\d{4})$/);
  if (named) {
    const monthNames: Record<string, string> = {
      jan: '01',
      feb: '02',
      mar: '03',
      apr: '04',
      may: '05',
      jun: '06',
      jul: '07',
      aug: '08',
      sep: '09',
      oct: '10',
      nov: '11',
      dec: '12'
    };
    const month = monthNames[named[2].toLowerCase()];
    if (month) {
      const year = named[3].length === 2 ? `20${named[3]}` : named[3];
      return `${year}-${month}-${named[1].padStart(2, '0')}`;
    }
  }

  throw new Error(`Unsupported date: ${value}`);
}

function parseMoney(value: string) {
  return Number(value.replace(/RM/gi, '').replace(/,/g, '').trim());
}

function detectInstitution(text: string) {
  const upper = text.toUpperCase();
  if (upper.includes('TOUCH') && upper.includes('GO')) return 'TnG';
  if (upper.includes('PUBLIC BANK') || upper.includes('PBB')) return 'Public Bank';
  if (upper.includes('MAXIS')) return 'Maxis';
  return 'Maybank';
}

function parseLines(text: string, sourceFile: string): ParseResult['transactions'] {
  const transactions: ParseResult['transactions'] = [];
  const patterns = [
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+(RM?\s?[\d,]+\.\d{2}|[\d,]+\.\d{2})\s*(CR|DR|DEBIT|CREDIT)?$/i,
    /(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\s+(.+?)\s+(RM?\s?[\d,]+\.\d{2}|[\d,]+\.\d{2})\s*(CR|DR|DEBIT|CREDIT)?$/i
  ];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    if (!line) continue;

    const match = patterns.map((pattern) => line.match(pattern)).find(Boolean);
    if (!match) continue;

    const marker = (match[4] ?? '').toUpperCase();
    const description = match[2].trim();
    const amount = parseMoney(match[3]);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const direction: TransactionDirection = marker === 'CR' || marker === 'CREDIT' ? 'in' : 'out';
    transactions.push({
      date: parseDate(match[1]),
      description,
      amount,
      direction,
      source_file: sourceFile
    });
  }

  return transactions;
}

export async function parseStatementPdf(file: File): Promise<ParseResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  const text = result.text ?? '';
  const parseErrors: string[] = [];

  if (!text.trim()) {
    parseErrors.push('No extractable text found in PDF.');
  }

  let transactions: ParseResult['transactions'] = [];
  try {
    transactions = parseLines(text, file.name || 'statement.pdf');
  } catch (error) {
    parseErrors.push(error instanceof Error ? error.message : 'PDF parse failed.');
  }

  if (text.trim() && transactions.length === 0) {
    parseErrors.push('No transactions matched the supported statement patterns.');
  }

  const statementMonth = transactions[0]?.date.slice(0, 7);
  return {
    account_institution: detectInstitution(text),
    statement_month: statementMonth,
    transactions,
    parse_errors: parseErrors
  };
}
