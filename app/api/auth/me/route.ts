// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const res = NextResponse.json({}); // la usaremos para setear cookies si hiciera falta
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => res.cookies.set(name, value, options as any),
        remove: (name, options) => res.cookies.set(name, "", { ...(options as any), maxAge: 0 }),
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();

  return NextResponse.json({
    ok: !error,
    user: data?.user ?? null,
    error: error?.message ?? null,
  });
}
