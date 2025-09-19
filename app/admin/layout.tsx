// app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>Panel Admin</h1>
      <nav style={{ display: "flex", gap: 12, margin: "12px 0 24px" }}>
        <a href="/admin/programs">Programas</a>
        <a href="/admin/subjects">Materias</a>
        <a href="/admin/terms">Periodos</a>
        <a href="/admin/groups">Grupos</a>
      </nav>
      {children}
    </div>
  );
}
