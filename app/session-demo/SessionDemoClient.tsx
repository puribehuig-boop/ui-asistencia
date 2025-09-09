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
    const base = { Presente: 0, Tarde: 0, Ausente: 0, Justifica
