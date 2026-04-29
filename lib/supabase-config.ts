export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function getSupabasePublicConfig(): {
  url: string;
  anonKey: string;
} {
  return {
    url: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getOptionalSupabasePublicConfig():
  | {
      url: string;
      anonKey: string;
    }
  | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseServerConfig(): {
  url: string;
  key: string;
} {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  // Server-side privileged client must use the service-role key only.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) {
    throw new Error("Supabase server key is not configured. Set SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, key };
}
