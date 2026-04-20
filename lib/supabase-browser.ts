"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  browserClient = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

export async function ensureSupabaseSession(): Promise<Session | null> {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return null;
  }

  const {
    data: { session },
  } = await client.auth.getSession();

  if (session) {
    return session;
  }

  const { data, error } = await client.auth.signInAnonymously();

  if (error) {
    throw new Error(error.message);
  }

  return data.session ?? null;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const session = await ensureSupabaseSession();
  return session?.access_token ?? null;
}
