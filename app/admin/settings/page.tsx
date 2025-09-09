'use client';

import { useEffect, useState } from 'react';

export default function AdminSettingsPage() {
  const [adminPass, setAdminPass] = useState('');
  const [tol, setTol] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [replaceAll, setReplaceAll] = useState(false);

  const fetchTol = async () => {
    if (!adminPass) return;
    setLoading(true); setMsg(null);
    try {
      const r = await fetch('/api/admin/settings', { headers: { 'x-admin-password': adminPass } });
      if (!r.ok) {
        setMsg('No autorizado o error al leer ajustes.');
      } else {
        const j = await r.json();
        setTol(j.attendance_tolerance_min ?? '');
      }
    } catch (e: any) {
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { /* no auto-fetch sin password */ }, []);

  const saveTol = async () => {
    if (tol === '' || Number(tol) < 0 || Number(tol) > 240) {
      setMsg('Valor inválido: usa 0 a 240 minutos.');
      return;
    }
    setLoading(true); setMsg(null);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPass
        },
        body: JSON.stringify({ attendance_tolerance_min: Number(tol) }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Error al guardar');
      setMsg('Tolerancia guardada correctamente.');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const importCsv = async () => {
    if (!csvText.trim()) {
      setMsg('Carga un CSV antes de importar.');
      return;
    }
    setLoading(true); setMsg(null);
    try {
      const url = `/api/admin/schedule/import${replaceAll ? '?replace=1' : ''}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv', 'x-admin-password': adminPass },
        body: csvText,
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Error al importar');
      setMsg(`Importación completa. Filas insertadas: ${j.inserted}${replaceAll ? ' (reemplazo total)' : ''}.`);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    const text = await f.text();
    setCsvText(text);
  };

  return (
    <main className="space-y-6">
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-3">Acceso administrador</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm mb-1 opacity-80">Contraseña de admin</label>
            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Ingresa tu contraseña"
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10"
            />
          </div>
          <button
            onClick={fetchTol}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
          >
            Conectar
          </button>
        </div>
        {msg && <p className="text-xs mt-3 opacity-80">{msg}</p>}
      </section>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-medium mb-3">Tolerancia global (minutos)</h3>
        <div className="flex items-end gap-3">
          <input
            type="number"
            min={0}
            max={240}
            value={tol}
            onChange={(e) => setTol(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="15"
            className="w-32 px-3 py-2 rounded-lg bg-white/10 border border-white/10"
          />
          <button
            onClick={saveTol}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
            disabled={loading || !adminPass}
          >
            Guardar
          </button>
        </div>
        <p className="text-xs opacity-70 mt-2">Se aplica a la resolución de sesiones en <code>/scan?roomId=...</code>.</p>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-medium mb-3">Cargar horarios (CSV)</h3>
        <p className="text-xs opacity-70 mb-3">
          Columnas requeridas: <code>room_code, subject, group_name, weekday, start_time, end_time</code>.
          <br />Ejemplo: <code>A-101, Cálculo I, Grupo A, 1, 08:00, 09:30</code>
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => onFile(e.target.files?.[0] || undefined)}
            className="block"
          />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={replaceAll} onChange={(e) => setReplaceAll(e.target.checked)} />
            Reemplazar todo (borra la tabla antes de importar)
          </label>
          <button
            onClick={importCsv}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
            disabled={loading || !adminPass}
          >
            Importar
          </button>
        </div>
        <textarea
          rows={8}
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-xs"
          placeholder="Pega aquí el CSV si lo prefieres…"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />
      </section>
    </main>
  );
}
