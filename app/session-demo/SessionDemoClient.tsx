'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

type EstadoSesion = 'No iniciada' | 'En curso' | 'Finalizada';
const ESTADOS_ALUMNO = ['Presente', 'Tarde', 'Ausente', 'Justificado'] as const;
type EstadoAlumno = (typeof ESTADOS_ALUMNO)[number];

type Alumno = {
  id: string;
  nombre: string;
  status?: EstadoAlumno;
};

const alumnosBase: Alumno[] = [
  { id: 'A-01', nombre: 'Ana Torres' },
  { id: 'A-02', nombre: 'Luis Gómez' },
  { id: 'A-03', nombre: 'María Pérez' },
  { id: 'A-04', nombre: 'Carlos Ruiz' },
];

export default function SessionDemoClient() {
  const params = useSearchParams();
  const sessionId = params.get('sessionId') ?? 'demo-123';
  const roomId = params.get('roomId') ?? 'A-101';

  const [estado, setEstado] = useState<EstadoSesion>('No iniciada');
  const [alumnos, setAlumnos] = useState<Alumno[]>(alumnosBase);

  const puedeIniciar = estado === 'No iniciada';
  const puedeMarcar = estado === 'En curso'; // Nota: "Justificado" será editable siempre (ver más abajo)
  const puedeTerminar = estado === 'En curso';

  const info = useMemo(
    () => ({
      materia: 'Introducción a la Ingeniería',
      grupo: 'Grupo A',
      salon: roomId,
      horario: '08:00–09:30',
    }),
    [roomId]
  );

  const marcar = (id: string, status: EstadoAlumno) => {
    setAlumnos((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const resumen = useMemo(() => {
    const base = { Presente: 0, Tarde: 0, Ausente: 0, Justificado: 0 } as Record<EstadoAlumno, number>;
    for (const a of alumnos) {
      if (a.status) base[a.status]++;
    }
    const total = alumnos.length;
    return { ...base, total };
  }, [alumnos]);

  return (
    <main className="space-y-6">
      {/* Encabezado de sesión */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold">Sesión: {sessionId}</h2>
            <p className="opacity-80 text-sm mt-1">
              {info.materia} · {info.grupo} · Salón {info.salon} · {info.horario}
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/10">
            {estado}
          </span>
        </div>

        {/* Acciones de la sesión */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            disabled={!puedeIniciar}
            onClick={() => setEstado('En curso')}
            className={
              'px-4 py-2 rounded-xl border ' +
              (puedeIniciar
                ? 'bg-white/10 hover:bg-white/20 border-white/10'
                : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed')
            }
          >
            Iniciar clase
          </button>

          <button
            disabled={!puedeMarcar}
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className={
              'px-4 py-2 rounded-xl border ' +
              (puedeMarcar
                ? 'bg-white/10 hover:bg-white/20 border-white/10'
                : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed')
            }
          >
            Tomar asistencia
          </button>

          <button
            disabled={!puedeTerminar}
            onClick={() => setEstado('Finalizada')}
            className={
              'px-4 py-2 rounded-xl border ' +
              (puedeTerminar
                ? 'bg-white/10 hover:bg-white/20 border-white/10'
                : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed')
            }
          >
            Terminar clase
          </button>
        </div>

        {/* Resumen rápido */}
        <div className="mt-4 text-xs opacity-80 flex flex-wrap gap-x-4 gap-y-1">
          <span>Total: {resumen.total}</span>
          <span>Presente: {resumen.Presente}</span>
          <span>Tarde: {resumen.Tarde}</span>
          <span>Ausente: {resumen.Ausente}</span>
          <span>Justificado: {resumen.Justificado}</span>
        </div>

        <p className="mt-2 text-xs opacity-70">
          Nota: <b>Justificado</b> puede editarse en cualquier momento, incluso después de finalizar la sesión.
        </p>
      </section>

      {/* Lista de alumnos */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-medium mb-3">Lista de alumnos</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alumnos.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3"
            >
              <div className="text-sm">
                <div className="font-medium">{a.nombre}</div>
                <div className="opacity-70 text-xs">{a.id}</div>
              </div>

              <div className="flex gap-2">
                {ESTADOS_ALUMNO.map((s) => {
                  // Regla: los estados normales solo cuando está "En curso".
                  // "Justificado" es editable SIEMPRE (antes, durante y después).
                  const editableSiempre = s === 'Justificado';
                  const disabled = !(estado === 'En curso' || editableSiempre);

                  return (
                    <button
                      key={s}
                      disabled={disabled}
                      onClick={() => marcar(a.id, s)}
                      className={
                        'px-3 py-1 text-xs rounded-lg border ' +
                        (a.status === s ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20') +
                        (disabled ? ' opacity-50 cursor-not-allowed' : '')
                      }
                      title={
                        editableSiempre
                          ? 'Justificado se puede marcar en cualquier momento'
                          : estado !== 'En curso'
                          ? 'Solo editable durante la sesión'
                          : ''
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
