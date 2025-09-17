import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const created = await prisma.program.create({ data: { name: "Licenciatura en Derecho" }});
    return NextResponse.json({ ok: true, created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
