export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import ExportCsvButton from '../../components/ExportCsvButton';

export const dynamic = 'force-static';

type SessionRow = {
  id: string;
  grupo: string;
  materia: string;
  salon: string;
  horario: string;
  estado: "No iniciada" | "En curso" | "Finalizada";
};

const mock: SessionRow[] = [
  { id: "S-101", grupo: "Gpo A", materia: "Cálculo I", salon: "A-201", horario: "08:00–09:30", estado: "En curso" },
  { id: "S-102", grupo: "Gpo B", materia: "Psicología", salon: "B-105", horario: "09:30–11:00", estado: "No iniciada" },
  { id: "S-103", grupo: "Gpo C", materia: "Derecho Civil", salon: "C-302", horario: "11:00–12:30", estado: "Finalizada" },
];

export default function AdminPage() {
  return (
    <main className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">Sesiones del día</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left opacity-70">
            <tr>
              <th className="py-2 pr-4">ID</th>
              <th className="py-2 pr-4">Grupo</th>
              <th className="py-2 pr-4">Materia</th>
              <th className="py-2 pr-4">Salón</th>
              <th className="py-2 pr-4">Horario</th>
              <th className="py-2 pr-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {mock.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="py-2 pr-4">{r.id}</td>
                <td className="py-2 pr-4">{r.grupo}</td>
                <td className="py-2 pr-4">{r.materia}</td>
                <td className="py-2 pr-4">{r.salon}</td>
                <td className="py-2 pr-4">{r.horario}</td>
                <td className="py-2 pr-4">{r.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ExportCsvButton />
    </main>
  );
}

