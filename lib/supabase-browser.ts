"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

import { getOptionalSupabasePublicConfig } from "./supabase-config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) {
    return browserClient;
  }

  const config = getOptionalSupabasePublicConfig();

  if (!config) {
    return null;
  }

  browserClient = createClient(config.url, config.anonKey, {
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
