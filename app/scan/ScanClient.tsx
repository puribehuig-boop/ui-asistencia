'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

type Slot = {
  roomId: string;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  subject: string;
  group: string;
};

// 👇 Horarios de ejemplo para el demo (luego se leerán de BD)
const schedule: Slot[] = [
  { roomId: 'A-101', start: '08:00', end: '09:30', subject: 'Introducción a la Ingeniería', group: 'Grupo A' },
  { roomId: 'A-101', start: '10:00', end: '11:30', subject: 'Cálculo I', group: 'Grupo A' },
  { roomId: 'B-105', start: '09:30', end: '11:00', subject: 'Psicología', group: 'Grupo B' },
  { roomId: 'C-302', start: '11:00', end: '12:30', subject: 'Derecho Civil', group: 'Grupo C' },
];

function parseTodayTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function withinWindow(now: Date, start: Date, end: Date, toleranceMin = 15) {
  const startTol = new Date(start.getTime() - toleranceMin * 60000);
  const endTol = new Date(end.getTime() + toleranceMin * 60000);
  return now >= startTol && now <= endTol;
}

export default function ScanClient() {
  const params = useSearchParams();
  const roomId = params.get('roomId') ?? 'A-101';

  const resolution = useMemo(() => {
    const now = new Date();
    const candidates = schedule.filter(s => s.roomId === roomId);
    const match = candidates.find(s => withinWindow(now, parseTodayTime(s.start), parseTodayTime(s.end)));
    if (!match) return { found: false as const };

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    const sessionId = `${roomId}-${yyyy}${mm}${dd}-${match.start.replace(':','')}`;
    const horario = `${match.start}–${match.end}`;

    return {
      found: true as const,
      sessionId,
      subject: match.subject,
      group: match.group,
      horario,
      roomId,
      url: `/session-demo?sessionId=${encodeURIComponent(sessionId)}&roomId=${encodeURIComponent(roomId)}`,
    };
  }, [roomId]);

  if (!resolution.found) {
    const fallbackUrl = `/session-demo?sessionId=${encodeURIComponent(`${roomId}-manual`)}&roomId=${encodeURIComponent(roomId)}`;
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-lg font-semibold">Salón: {roomId}</h1>
        <p className="opacity-80">No hay sesión en curso (según horario de ejemplo).</p>
        <a
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
          href={fallbackUrl}
        >
          Continuar en modo manual
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <h1 className="text-lg font-semibold">Salón: {resolution.roomId}</h1>
      <div className="text-center">
        <div className="text-base font-medium">{resolution.subject}</div>
        <div className="text-sm opacity-80">{resolution.group} · {resolution.horario}</div>
      </div>
      <a
        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
        href={resolution.url}
      >
        Ir a la sesión
      </a>
    </main>
  );
}
