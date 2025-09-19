// app/admin/layout.tsx
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// ⚠️ Fuerza ejecución en servidor por request
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Profile = { user_id: string; email: string | null; role: "admin" | "docente" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  const ADMIN_DEBUG = process.env.ADMIN_DEBUG === "1";

  // ---- DIAGNÓSTICO: muestra lo que ve el layout, sin redirigir ----
  if (ADMIN_DEBUG) {
    let profile: Profile | null = null;
    if (data?.user) {
      const rows = await prisma.$queryRaw<Profile[]>`
        SELECT user_id, email, role
        FROM public.profiles
        WHERE user_id = ${data.user.id}
        LIMIT 1
      `;
      profile = rows[0] ?? null;
    }

    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-3">Admin Debug (layout)</h1>
        <pre className="text-xs p-3 bg-black/5 rounded mb-4">
{JSON.stringify(
  { hasUser: !!data?.user, user: data?.user ?? null, error: error?.message ?? null, profile },
  null,
  2
)}
        </pre>
        <p className="mb-2 text-sm">
          Si <b>hasUser</b> es <code>true</code> y <b>profile.role</b> es <code>admin</code>,
          el guard debería permitir acceso.
        </p>
        <nav className="flex gap-4 text-sm underline underline-offset-4">
          <a href="/api/auth/me">/api/auth/me</a>
          <a href="/admin">/admin (este mismo layout)</a>
          <a href="/logout">/logout</a>
        </nav>
        <div className="mt-6 border-t border-white/10 pt-6">{children}</div>
      </main>
    );
  }
  // -----------------------------------------------------------------

  // Guard real (cuando ADMIN_DEBUG !== '1')
  if (error || !data?.user) {
    redirect("/login");
  }

  const rows = await prisma.$queryRaw<Profile[]>`
    SELECT user_id, email, role
    FROM public.profiles
    WHERE user_id = ${data.user.id}
    LIMIT 1
  `;
  const profile = rows[0] ?? null;

  if (!profile || profile.role !== "admin") {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-3">Acceso restringido</h1>
        <p>No cuentas con permisos para ver esta sección.</p>
        <p className="mt-2 text-sm opacity-70">Usuario: {data.user.email ?? data.user.id}</p>
      </main>
    );
  }

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
