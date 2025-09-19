"use client";

import { useEffect, useState } from "react";

type Term = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
};

export default function TermsPage() {
  const [items, setItems] = useState<Term[]>([]);
  const [name, setName] = useState("");
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const r = await fetch("/api/admin/terms", { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setItems(j.terms ?? []);
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/terms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setName("");
      setStart("");
      setEnd("");
      await load();
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    if (!confirm(`¿Borrar periodo #${id}?`)) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/terms/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      await load();
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Periodos</h2>

      <form onSubmit={create} className="flex flex-wrap gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 grow"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del periodo (p.ej. Ene-Jun 2026)"
        />
        <input
          className="border rounded px-2 py-1"
          type="date"
          value={startDate}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1"
          type="date"
          value={endDate}
          onChange={(e) => setEnd(e.target.value)}
        />
        <button className="border rounded px-3 py-1" disabled={loading}>
          Guardar
        </button>
      </form>

      {err && <p className="text-red-600 mb-2">Error: {err}</p>}

      <table className="w-full text-sm">
        <thead className="text-left opacity-70 border-b">
          <tr>
            <th className="py-2">ID</th>
            <th>Nombre</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2">{t.id}</td>
              <td>{t.name}</td>
              <td>{new Date(t.startDate).toLocaleDateString()}</td>
              <td>{new Date(t.endDate).toLocaleDateString()}</td>
              <td>
                <button
                  className="text-red-600"
                  onClick={() => remove(t.id)}
                  disabled={loading}
                >
                  Borrar
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-neutral-500">
                Sin registros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
