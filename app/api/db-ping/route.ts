export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { Client } from "pg";

export async function GET() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return NextResponse.json({ ok:false, error:"No DATABASE_URL" }, { status:500 });

  const u = new URL(raw);

  const cfg = {
    user: u.username,                               // 👈 Debe ser "postgres.<ref>"
    password: u.password,
    host: u.hostname,                               // aws-1-us-east-2.pooler.supabase.com
    port: Number(u.port || "6543"),
    database: (u.pathname || "/postgres").slice(1), // "postgres"
    ssl: { require: true, rejectUnauthorized: false }
  };

  const client = new Client(cfg as any);

  try {
    await client.connect();
    const r = await client.query("SELECT now() as now");
    await client.end();
    return NextResponse.json({ ok: true, now: r.rows[0].now, diag: { ...cfg, password: '***' } });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: String(e), diag: { ...cfg, password: '***' } }, { status:500 });
  }
}
