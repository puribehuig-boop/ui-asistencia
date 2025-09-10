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
function esc(s: any) {
  const v = (s ?? '').toString();
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return new NextResponse('unauthorized', { status: 401 });

  const url = new URL(req.url);
  const date = (url.searchParams.get('date') || todayMX()).trim();
  const room = (url.searchParams.get('room') || '').trim();
  const group = (url.searchParams.get('group') || '').trim();
  const status = (url.searchParams.get('status') || '').trim();

  let q = supabaseAdmin
    .from('sessions')
    .select('id, session_code, session_date, room_code, subject, group_name, start_planned, end_planned, status, arrival_status, arrival_delay_min, started_at, ended_at')
    .eq('session_date', date);
  if (room) q = q.ilike('room_code', `%${room}%`);
  if (group) q = q.ilike('group_name', `%${group}%`);
  if (status) q = q.eq('status', status);

  const { data: sessions, error: errSes } = await q;
  if (errSes) return new NextResponse('error: ' + errSes.message, { status: 500 });

  const ids = (sessions ?? []).map(s => s.id);
  const header = [
    'session_code','session_date','room_code','subject','group_name',
    'start_planned','end_planned','status','arrival_status','arrival_delay_min',
    'started_at','ended_at',
    'student_id','student_name','attendance_status','attendance_updated_at','attendance_updated_by'
  ].join(',');

  if (ids.length === 0) {
    const csv = header + '\n';
    return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="asistencias_${date}.csv"` } });
  }

  const { data: att, error: errAtt } = await supabaseAdmin
    .from('attendance')
    .select('session_id, student_id, student_name, status, updated_at, updated_by')
    .in('session_id', ids);
  if (errAtt) return new NextResponse('error: ' + errAtt.message, { status: 500 });

  const bySession = new Map<number, any[]>();
  att?.forEach(a => {
    const arr = bySession.get(a.session_id) || [];
    arr.push(a);
    bySession.set(a.session_id, arr);
  });

  const lines: string[] = [header];
  for (const s of sessions ?? []) {
    const rows = bySession.get(s.id);
    if (!rows || rows.length === 0) {
      lines.push([
        esc(s.session_code), esc(s.session_date), esc(s.room_code), esc(s.subject), esc(s.group_name),
        esc(s.start_planned), esc(s.end_planned), esc(s.status), esc(s.arrival_status), esc(s.arrival_delay_min),
        esc(s.started_at), esc(s.ended_at),
        '', '', '', '', ''
      ].join(','));
    } else {
      for (const a of rows) {
        lines.push([
          esc(s.session_code), esc(s.session_date), esc(s.room_code), esc(s.subject), esc(s.group_name),
          esc(s.start_planned), esc(s.end_planned), esc(s.status), esc(s.arrival_status), esc(s.arrival_delay_min),
          esc(s.started_at), esc(s.ended_at),
          esc(a.student_id), esc(a.student_name), esc(a.status), esc(a.updated_at), esc(a.updated_by)
        ].join(','));
      }
    }
  }

  const csv = lines.join('\n') + '\n';
  return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="asistencias_${date}.csv"` } });
}
