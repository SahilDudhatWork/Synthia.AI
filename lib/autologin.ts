// lib/auth.ts
import { supabase } from "./supabaseClient"; // client-side supabase

export async function autoLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

