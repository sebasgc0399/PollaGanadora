import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente de navegador (clave pública "anon"). Se crea de forma perezosa para
// no romper el build cuando aún no hay variables de entorno configuradas.

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabase(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local (o en Vercel)."
    );
  }

  browserClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return browserClient;
}
