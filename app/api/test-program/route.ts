import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const name = "Licenciatura en Derecho";
    const existing = await prisma.program.findFirst({ where: { name } });

    const result = existing ?? (await prisma.program.create({ data: { name } }));
    return NextResponse.json({ ok: true, created: result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
