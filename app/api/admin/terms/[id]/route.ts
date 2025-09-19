import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
export const runtime = "nodejs";

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  try {
    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) return fail("id inválido", 400);
    await prisma.term.delete({ where: { id } });
    return ok({ deleted: id });
  } catch (e) { return fail(e); }
}
