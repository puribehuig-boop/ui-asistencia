import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  const supabase = createSupabaseServerClient();

  if (code) {
    // Crea la sesión (setea cookies)
    await supabase.auth.exchangeCodeForSession(code);
  }
  // Redirige al Admin (o al home si prefieres)
  return NextResponse.redirect(new URL("/admin", req.url));
}
