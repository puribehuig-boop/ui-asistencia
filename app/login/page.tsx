"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!email.trim()) return;
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setMsg("Te enviamos un enlace de acceso. Revisa tu correo.");
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-3">Iniciar sesión</h1>
      <form onSubmit={sendLink} className="flex gap-2">
        <input
          className="border rounded px-2 py-1 flex-1 text-black"
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />
        <button className="border rounded px-3 py-1" disabled={loading}>Enviar enlace</button>
      </form>
      {msg && <p className="text-green-700 mt-3">{msg}</p>}
      {err && <p className="text-red-600 mt-3">Error: {err}</p>}
    </main>
  );
}
