// app/admin/layout.tsx
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // el guard no debe cachearse
export const runtime = "nodejs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) Leer sesión desde cookies (lado servidor)
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  // No autenticado → a /login
  if (error || !data?.user) {
    redirect("/login");
  }

  // 2) Consultar rol en public.profiles (tu tabla)
  type Profile = { user_id: string; email: string | null; role: "admin" | "docente" };

  const rows = await prisma.$queryRaw<Profile[]>`
    SELECT user_id, email, role
    FROM public.profiles
    WHERE user_id = ${data.user.id}
    LIMIT 1
  `;
  const profile = rows[0] ?? null;

  // Si no hay perfil o no es admin → 403 simple
  if (!profile || profile.role !== "admin") {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-3">Acceso restringido</h1>
        <p>No cuentas con permisos para ver esta sección.</p>
        <p className="mt-2 text-sm opacity-70">
          Usuario: {data.user.email ?? data.user.id}
        </p>
      </main>
    );
  }

  // 3) Render normal del panel admin
  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Panel Admin</h1>
        <nav className="flex gap-4 mt-3 text-sm">
          <a href="/admin" className="underline-offset-4 hover:underline">
            Inicio
          </a>
          <a href="/admin/programs" className="underline-offset-4 hover:underline">
            Programas
          </a>
          <a href="/admin/subjects" className="underline-offset-4 hover:underline">
            Materias
          </a>
          <a href="/admin/terms" className="underline-offset-4 hover:underline">
            Periodos
          </a>
          <a href="/admin/groups" className="underline-offset-4 hover:underline">
            Grupos
          </a>
          <a href="/logout" className="underline-offset-4 hover:underline">
            Salir
          </a>
        </nav>
      </header>
      {children}
    </div>
  );
}
