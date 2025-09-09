import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

function minutesFromHHMM(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// HH:MM (24h) en zona MX
function nowHHMMMexico() {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
  return s;
}

// 0=domingo ... 6=sábado, según zona MX
function weekdayMexico() {
  const short = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    weekday: 'short',
  })
    .formatToParts(new Date())
    .find(p => p.type === 'weekday')
    ?.value?.toLowerCase();

  const map: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
  };
  return map[short ?? 'mon'] ?? 1;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId') ?? '';

  if (!roomId) {
    return NextResponse.json({ found: false, reason: 'missing_roomId' }, { status: 400 });
  }

  // 1) Tolerancia global
  const { data: settings } = await supabase
    .from('global_settings')
    .select('attendance_tolerance_min')
    .eq('id', 1)
    .maybeSingle();

  const tolerance = settings?.attendance_tolerance_min ?? 15;

  // 2) Slots de hoy para ese salón
  const wd = weekdayMexico();
  const { data: slots, error } = await supabase
    .from('schedule_slots')
    .select('*')
    .eq('room_code', roomId)
    .eq('weekday', wd);

  if (error) {
    return NextResponse.json({ found: false, reason: 'db_error', details: error.message }, { status: 500 });
  }

  const nowHHMM = nowHHMMMexico();
  const nowMin = minutesFromHHMM(nowHHMM);

  const match = (slots ?? []).find((s: any) => {
    const start = minutesFromHHMM(String(s.start_time).slice(0, 5));
    const end   = minutesFromHHMM(String(s.end_time).slice(0, 5));
    return nowMin >= (start - tolerance) && nowMin <= (end + tolerance);
  });

  // Fecha YYYYMMDD en MX
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date()).replaceAll('/', '');

  if (!match) {
    const sessionId = `${roomId}-${today}-manual`;
    return NextResponse.json({
      found: false,
      sessionId,
      roomId,
      tolerance,
    });
  }

  const startHHMM = String(match.start_time).slice(0, 5).replace(':', '');
  const sessionId = `${roomId}-${today}-${startHHMM}`;

  return NextResponse.json({
    found: true,
    sessionId,
    roomId,
    subject: match.subject,
    group_name: match.group_name,
    horario: `${String(match.start_time).slice(0,5)}–${String(match.end_time).slice(0,5)}`,
    tolerance,
  });
}
