import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.DATABASE_URL || "";
  try {
    const url = new URL(raw);
    return NextResponse.json({
      ok: true,
      protocol: url.protocol,
      host: url.hostname,
      port: url.port,
      db: url.pathname,
      hasQuery: url.search.length > 0,
      pooled: url.port === "6543" || url.search.includes("pgbouncer"),
    });
  } catch {
    return NextResponse.json({ ok: false, msg: "DATABASE_URL inválida o ausente" }, { status: 500 });
  }
}
