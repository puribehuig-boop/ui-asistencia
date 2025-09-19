export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const programs = await prisma.program.findMany({ orderBy:{ id:'asc' }});
  return NextResponse.json({ ok:true, programs });
}
