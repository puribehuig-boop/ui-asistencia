import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

async function isAdmin(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) {
    const { data: userRes } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles').select('role').eq('user_id', user.id).maybeSingle();
      if (profile?.role === 'admin') return true;
    }
  }
  const pass = req.headers.get('x-admin-password') ?? '';
  return pass && pass === process.env.ADMIN_UI_PASSWORD;
}

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('global_settings')
    .select('attendance_tolerance_min, late_threshold_min')
    .eq('id', 1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({
    ok: true,
    attendance_tolerance_min: data?.attendance_tolerance_min ?? 15,
    late_threshold_min: data?.late_threshold_min ?? 30
  });
}

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

  const tol = Number(body?.attendance_tolerance_min);
  const late = Number(body?.late_threshold_min);

  if (!Number.isFinite(tol) || tol < 0 || tol > 240) return NextResponse.json({ ok: false, error: 'tolerance_out_of_range' }, { status: 400 });
  if (!Number.isFinite(late) || late < tol || late > 240) return NextResponse.json({ ok: false, error: 'late_threshold_must_be>=tolerance_and<=240' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('global_settings')
    .upsert({ id: 1, attendance_tolerance_min: tol, late_threshold_min: late });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, attendance_tolerance_min: tol, late_threshold_min: late });
}
