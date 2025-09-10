import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

    if (!token) return NextResponse.json({ ok: true, loggedIn: false });

    const { data: userRes, error: uErr } = await supabase.auth.getUser(token);
    if (uErr || !userRes?.user) return NextResponse.json({ ok: true, loggedIn: false });

    const user = userRes.user;
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      loggedIn: true,
      email: user.email,
      role: profile?.role ?? 'docente'
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
