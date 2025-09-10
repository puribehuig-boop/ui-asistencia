import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabaseClient';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

async function isAdmin(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) {
    const { data: userRes } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (user) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('user_id', user.id).maybeSingle();
      if (profile?.role === 'admin') return true;
    }
  }
  const pass = req.headers.get('x-admin-password') ?? '';
  return pass && pass === process.env.ADMIN_UI_PASSWORD;
}

function todayMX() {
  const s = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return s;
}

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const date = (url.searchParams.get('date') || todayMX()).trim();
  const room = (url.searchParams.get('room') || '').trim();
  const group = (url.searchParams.get('group') || '').trim();
  const status = (url.searchParams.get('status') || '').trim();

  let q = supabaseAdmin
    .from('sessions')
    .select('id, session_code, session_date, room_code, subject, group_name, start_planned, end_planned, started_at, ended_at, status, arrival_status, arrival_delay_min')
    .eq('session_date', date)
    .order('start_planned', { ascending: true, nullsFirst: true })
    .order('room_code', { ascending: true });

  if (room) q = q.ilike('room_code', `%${room}%`);
  if (group) q = q.ilike('group_name', `%${group}%`);
  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, date, items: data ?? [] });
}
