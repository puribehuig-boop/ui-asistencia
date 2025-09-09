'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

type Alumno = { id: string; nombre: string; status?: 'Presente'|'Tarde'|'Ausente' };
const alumnosBase: Alumno[] = [
  { id: 'A-01', nombre: 'Ana Torres' },
  { id: 'A-02', nombre: 'Luis Gómez' },
  { id: 'A-03', nombre: 'María Pérez' },
  { id: 'A-04', nombre: 'Carlos Ruiz' },
];

export default function SessionDemo() {
  const params = useSearchParams();
  const sessionId = params.get('sessionId') ?? 'demo-123';
  const [estado, setEstado] = useState<'No iniciada'|'En curso'|'Finalizada'>('No iniciada');
  const [alumnos, setAlumnos] = useState<Alumno[]>(alumnosBase);
  const puedeIniciar = estado === 'No iniciada';
  const puedeMarcar = estado === 'En curso';
  const puedeTerminar = estado !== 'Finalizada' && estado !== 'No iniciada';

  const info = useMemo(() => ({
    materia: 'Introducción a la Ingeniería',
    grupo: 'Grupo A',
    salon: 'A-101',
    horario: '08:00–09:30',
  }), []);

  const marcar = (id: string, status: Alumno['status']) => {
    setAlumnos(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  return (
    <main className="space-y-6">
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold">Sesión: {sessionId}</h2>
            <p className="opacity-80 text-sm mt-1">
              {info.materia} · {info.grupo} · Salón {info.salon} · {info.horario}
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/10">{estado}</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            disabled={!puedeIniciar}
            onClick={() => setEstado('En curso')}
            className={"px-4 py-2 rounded-xl border " + (puedeIniciar ? "bg-white/10 hover:bg-white/20 border-white/10" : "bg-white/5 border-white/10 opacity-50 cursor-not-allowed")}
          >
            Iniciar clase
          </button>

          <button
            disabled={!puedeMarcar}
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className={"px-4 py-2 rounded-xl border " + (puedeMarcar ? "bg-white/10 hover:bg-white/20 border-white/10" : "bg-white/5 border-white/10 opacity-50 cursor-not-allowed")}
          >
            Tomar asistencia
          </button>

          <button
            disabled={!puedeTerminar}
            onClick={() => setEstado('Finalizada')}
            className={"px-4 py-2 rounded-xl border " + (puedeTerminar ? "bg-white/10 hover:bg-white/20 border-white/10" : "bg-white/5 border-white/10 opacity-50 cursor-not-allowed")}
          >
            Terminar clase
          </button>
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-medium mb-3">Lista de alumnos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alumnos.map(a => (
            <div key={a.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-sm">
                <div className="font-medium">{a.nombre}</div>
                <div className="opacity-70 text-xs">{a.id}</div>
              </div>
              <div className="flex gap-2">
                {['Presente','Tarde','Ausente'].map(s => (
                  <button
                    key={s}
                    disabled={estado !== 'En curso'}
                    onClick={() => marcar(a.id, s as any)}
                    className={"px-3 py-1 text-xs rounded-lg border " + (a.status === s ? "bg-white/20" : "bg-white/10 hover:bg-white/20") + (estado !== 'En curso' ? " opacity-50 cursor-not-allowed" : "")}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
