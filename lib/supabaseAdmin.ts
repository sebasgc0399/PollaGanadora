import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente de SERVIDOR con la clave service_role. Ignora RLS, así que SOLO debe
// usarse dentro de route handlers (nunca se envía al navegador).

let adminClient: SupabaseClient | null = null;

export function isServerConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Servidor sin configurar: faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  adminClient = createClient(url, key, { auth: { persistSession: false } });
  return adminClient;
}
