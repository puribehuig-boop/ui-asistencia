// app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        </nav>
      </header>
      {children}
    </div>
  );
}
