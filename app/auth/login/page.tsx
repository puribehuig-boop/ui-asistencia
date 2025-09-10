'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setMsg(null); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
      setCodeSent(true);
      setMsg('✅ Te enviamos un código. Revisa tu correo.');
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || 'No se pudo enviar el código'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setMsg(null); setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw error;
      setMsg('✅ Sesión iniciada. Ya puedes cerrar esta página o volver al Home.');
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || 'Código inválido'));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setMsg('Sesión cerrada.');
    setCode(''); setEmail(''); setCodeSent(false);
  };

  return (
    <main className="max-w-md mx-auto space-y-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
      <h1 className="text-lg font-semibold">Acceso docente / admin</h1>

      <div className="space-y-3">
        <label className="block text-sm opacity-80">Correo</label>
        <input
          type="email"
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10"
          placeholder="tu@dominio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={codeSent || loading}
        />
        {!codeSent ? (
          <button
            onClick={sendCode}
            disabled={!email || loading}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
          >
            Enviar código
          </button>
        ) : (
          <>
            <label className="block text-sm opacity-80 mt-4">Código (6 dígitos)</label>
            <input
              inputMode="numeric"
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
            />
            <div className="flex gap-2">
              <button
                onClick={verifyCode}
                disabled={!code || loading}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
              >
                Verificar y entrar
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
              >
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>

      {msg && <p className="text-xs opacity-80">{msg}</p>}

      <p className="text-xs opacity-60">Tip: tras iniciar sesión, vuelve a <a className="underline" href="/">Home</a> o a <a className="underline" href="/admin/sessions">Sesiones (admin)</a>.</p>
    </main>
  );
}
