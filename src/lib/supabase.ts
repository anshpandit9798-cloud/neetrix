import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseKeys() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  
  const localUrl = localStorage.getItem("SUPABASE_URL");
  const localKey = localStorage.getItem("SUPABASE_ANON_KEY");
  
  return {
    url: envUrl || localUrl || "",
    anonKey: envKey || localKey || "",
    isEnv: !!envUrl
  };
}

export function initSupabase(url: string, anonKey: string) {
  if (url && anonKey) {
    localStorage.setItem("SUPABASE_URL", url);
    localStorage.setItem("SUPABASE_ANON_KEY", anonKey);
    supabaseInstance = createClient(url, anonKey);
    return supabaseInstance;
  }
  return null;
}

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  
  const { url, anonKey } = getSupabaseKeys();
  if (url && anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey);
      return supabaseInstance;
    } catch (e) {
      console.error("Failed to initialize Supabase client", e);
    }
  }
  return null;
}
