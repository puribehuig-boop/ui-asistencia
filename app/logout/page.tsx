"use client";
import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function LogoutPage() {
  useEffect(() => {
    const run = async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    };
    run();
  }, []);
  return <main className="p-6">Saliendo…</main>;
}
