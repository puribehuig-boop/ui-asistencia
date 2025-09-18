export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { Client } from "pg";

export async function GET() {
  const cs = process.env.DATABASE_URL;
  if (!cs) return NextResponse.json({ ok:false, error:"No DATABASE_URL" }, { status:500 });

  const u = new URL(cs);

  // Construimos la config manualmente para no perder el username con el ".<ref>"
  const client = new Client({
    user: u.username,                             // 👈 Debe ser "postgres.anobturtdvcxdrvmppkb"
    password: u.password,
    host: u.hostname,                             // aws-1-us-east-2.pooler.supabase.com
    port: Number(u.port || "6543"),
    database: (u.pathname || "/postgres").slice(1),
    ssl: { require: true, rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const r = await client.query("SELECT now() as now");
    await client.end();
    return NextResponse.json({
      ok: true,
      now: r.rows[0].now,
      // diagnóstico (sin exponer pass)
      diag: { user: u.username, host: u.hostname, port: u.port || "6543", db: u.pathname }
    });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: String(e) }, { status:500 });
  }
}
