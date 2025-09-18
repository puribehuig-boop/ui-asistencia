import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const created = await prisma.program.upsert({
      where: { name: "Licenciatura en Derecho" },
      update: {},
      create: { name: "Licenciatura en Derecho" },
    });
    return NextResponse.json({ ok: true, created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
