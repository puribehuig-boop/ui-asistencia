'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

type Resolution =
  | { found: false; sessionId: string; roomId: string; tolerance: number; debug?: any }
  | { found: true; sessionId: string; roomId: string; subject: string; group_name: string; horario: string; tolerance: number; debug?: any };

export default function ScanClient() {
  const params = useSearchParams();
  const roomId = params.get('roomId') ?? 'A-101';
  const debug = params.get('debug') === '1';

  const [data, setData] = useState<Resolution | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const apiUrl = useMemo(() => {
    const q = new URLSearchParams({ roomId });
    if (debug) q.set('debug', '1');
    return `/api/schedule/resolve?${q.toString()}`;
  }, [roomId, debug]);

  useEffect(() => {
    fetch(apiUrl)
      .then(r => r.json())
      .then(setData)
      .catch(e => setErr(String(e)));
  }, [apiUrl]);

  if (err) return <main className="p-6">Error al validar el salón: {err}</main>;
  if (!data) return <main className="p-6">Validando salón…</main>;

  const debugBlock = !!data.debug && (
    <details className="mt-4 text-xs opacity-80">
      <summary>Ver debug</summary>
      <pre className="whitespace-pre-wrap bg-black/30 p-3 rounded-lg border border-white/10 mt-2">
{JSON.stringify(data.debug, null, 2)}
      </pre>
    </details>
  );

  if (data.found === false) {
    const fallbackUrl = `/session-demo?sessionId=${encodeURIComponent(data.sessionId)}&roomId=${encodeURIComponent(roomId)}`;
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-lg font-semibold">Salón: {roomId}</h1>
        <p className="opacity-80">No hay sesión en curso (tolerancia {data.tolerance} min).</p>
        <a className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10" href={fallbackUrl}>
          Continuar en modo manual
        </a>
        {debugBlock}
      </main>
    );
  }

  const go = `/session-demo?sessionId=${encodeURIComponent(data.sessionId)}&roomId=${encodeURIComponent(roomId)}`;
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <h1 className="text-lg font-semibold">Salón: {data.roomId}</h1>
      <div className="text-center">
        <div className="text-base font-medium">{data.subject}</div>
        <div className="text-sm opacity-80">{data.group_name} · {data.horario}</div>
        <div className="text-xs opacity-60 mt-1">Tolerancia: {data.tolerance} min</div>
      </div>
      <a className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10" href={go}>
        Ir a la sesión
      </a>
      {debugBlock}
    </main>
  );
}
