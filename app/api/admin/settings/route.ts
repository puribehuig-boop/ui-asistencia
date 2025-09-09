import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function checkAuth(req: Request) {
  const pass = req.headers.get('x-admin-password') ?? '';
  return pass && pass === process.env.ADMIN_UI_PASSWORD;
}

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin
    .from('global_settings')
    .select('attendance_tolerance_min')
    .eq('id', 1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, attendance_tolerance_min: data?.attendance_tolerance_min ?? 15 });
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const val = Number(body?.attendance_tolerance_min);
  if (!Number.isFinite(val) || val < 0 || val > 240) {
    return NextResponse.json({ ok: false, error: 'tolerance_out_of_range' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('global_settings')
    .upsert({ id: 1, attendance_tolerance_min: val });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, attendance_tolerance_min: val });
}
