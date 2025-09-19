// app/admin/layout.tsx
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";     // evita cachear el guard
export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    // No autenticado → login
    redirect("/login");
  }

  // Busca rol en tu DB (tabla "User") usando Prisma
  const u = await prisma.user.findUnique({ where: { id: data.user.id } });

  if (!u || u.role !== "admin") {
    // No es admin → 403 simple
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-3">Acceso restringido</h1>
        <p>No cuentas con permisos para ver esta sección.</p>
      </main>
    );
  }

  // Si pasa el guard, renderiza el layout y menú
  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Panel Admin</h1>
        <nav className="flex gap-4 mt-3 text-sm">
          <a href="/admin" className="underline-offset-4 hover:underline">Inicio</a>
          <a href="/admin/programs" className="underline-offset-4 hover:underline">Programas</a>
          <a href="/admin/subjects" className="underline-offset-4 hover:underline">Materias</a>
          <a href="/admin/terms" className="underline-offset-4 hover:underline">Periodos</a>
          <a href="/admin/groups" className="underline-offset-4 hover:underline">Grupos</a>
          <a href="/logout" className="underline-offset-4 hover:underline">Salir</a>
        </nav>
      </header>
      {children}
    </div>
  );
}
