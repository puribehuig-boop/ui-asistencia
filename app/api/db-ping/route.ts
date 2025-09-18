export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { Client } from "pg";

export async function GET() {
  const cs = process.env.DATABASE_URL;
  if (!cs) return NextResponse.json({ ok:false, error:"No DATABASE_URL" }, { status:500 });

  // Fuerza TLS en serverless: requiere SSL pero no verifica CA (solo diagnóstico)
  const client = new Client({
    connectionString: cs,
    ssl: { require: true, rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const r = await client.query("SELECT now() as now");
    await client.end();
    return NextResponse.json({ ok: true, now: r.rows[0].now });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: String(e) }, { status:500 });
  }
}
