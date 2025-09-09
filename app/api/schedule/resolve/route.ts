import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

const norm = (s: string) => String(s ?? '').trim().toLowerCase();

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

// 0=domingo ... 6=sábado
function weekdayMexico() {
  const short = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    weekday: 'short',
  }).formatToParts(new Date()).find(p => p.type === 'weekday')?.value?.toLowerCase();
  const map: Record<string, number> = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 };
  return map[short ?? 'mon'] ?? 1;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomIdRaw = url.searchParams.get('roomId') ?? '';
  const debug = url.searchParams.get('debug') === '1';
  const roomId = roomIdRaw.trim();

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

  // 2) Trae TODOS los slots de HOY (luego filtramos por salón normalizado)
  const wd = weekdayMexico();
  const { data: slots, error } = await supabase
    .from('schedule_slots')
    .select('*')
    .eq('weekday', wd);

  if (error) {
    return NextResponse.json({ found: false, reason: 'db_error', details: error.message }, { status: 500 });
  }

  const nowHHMM = nowHHMMMexico();
  const nowMin = minutesFromHHMM(nowHHMM);

  // Filtrado robusto por salón
  const byRoom = (slots ?? []).filter((s: any) => norm(s.room_code) === norm(roomId));

  const normalizedSlots = byRoom.map((s: any) => {
    const start_str = String(s.start_time).slice(0, 5);
    const end_str   = String(s.end_time).slice(0, 5);
    const start = minutesFromHHMM(start_str);
    const end   = minutesFromHHMM(end_str);
    return {
      ...s,
      start_str, end_str,
      startMin: start,
      endMin: end,
      startTol: start - tolerance,
      endTol: end + tolerance,
    };
  });

  const match = normalizedSlots.find((s: any) => nowMin >= s.startTol && nowMin <= s.endTol);

  // Fecha YYYYMMDD en MX
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date()).replaceAll('/', '');

  if (!match) {
    const sessionId = `${roomId}-${today}-manual`;
    const payload: any = { found: false, sessionId, roomId, tolerance };
    if (debug) {
      payload.debug = {
        nowHHMM, nowMin, weekday: wd,
        roomIdInput: roomIdRaw,
        normalizedRoomId: norm(roomId),
        slotsCountToday: (slots ?? []).length,
        slotsFilteredForRoom: normalizedSlots,
      };
    }
    return NextResponse.json(payload);
  }

  const startHHMM = match.start_str.replace(':', '');
  const sessionId = `${roomId}-${today}-${startHHMM}`;
  const payload: any = {
    found: true,
    sessionId,
    roomId,
    subject: match.subject,
    group_name: match.group_name,
    horario: `${match.start_str}–${match.end_str}`,
    tolerance,
  };
  if (debug) {
    payload.debug = {
      nowHHMM, nowMin, weekday: wd,
      roomIdInput: roomIdRaw,
      normalizedRoomId: norm(roomId),
      slotsFilteredForRoom: normalizedSlots,
      matched_slot: match,
    };
  }
  return NextResponse.json(payload);
}
