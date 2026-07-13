import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function createConfiguredServerSupabaseClient(
  allowCookieWrites: boolean,
): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch (error) {
            if (allowCookieWrites) {
              throw error;
            }
          }
        },
      },
    },
  );
}

export async function createServerSupabaseClient(): Promise<
  SupabaseClient<Database>
> {
  return createConfiguredServerSupabaseClient(false);
}

export async function createServerActionSupabaseClient(): Promise<
  SupabaseClient<Database>
> {
  return createConfiguredServerSupabaseClient(true);
}
