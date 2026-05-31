import { NextResponse } from 'next/server';
import { hasSupabaseEnv } from './supabase';

export function requireSupabaseEnv() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: 'Supabase environment variables are missing. Copy .env.local.example to .env.local and add keys.' },
      { status: 503 }
    );
  }
  return null;
}
