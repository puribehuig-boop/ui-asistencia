import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

function checkAuth(req: Request) {
  const pass = req.headers.get('x-admin-password') ?? '';
  return pass && pass === process.env.ADMIN_UI_PASSWORD;
}

// Parser simple para CSV plano (sin comillas con comas internas).
function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
    return obj;
  });
  return { headers, rows };
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const replaceAll = url.searchParams.get('replace') === '1';

  const text = await req.text();
  const { headers, rows } = parseCsv(text);

  const required = ['room_code','subject','group_name','weekday','start_time','end_time'];
  const missing = required.filter(h => !headers.includes(h));
  if (missing.length) {
    return NextResponse.json({ ok: false, error: 'missing_columns', details: missing }, { status: 400 });
  }

  // Validar y preparar filas
  const toInsert: any[] = [];
  for (const r of rows) {
    const weekday = Number(r.weekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return NextResponse.json({ ok: false, error: 'invalid_weekday', row: r }, { status: 400 });
    }
    const start = String(r.start_time).slice(0,5);
    const end = String(r.end_time).slice(0,5);
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
      return NextResponse.json({ ok: false, error: 'invalid_time_format', row: r }, { status: 400 });
    }
    toInsert.push({
      room_code: r.room_code,
      subject: r.subject,
      group_name: r.group_name,
      weekday,
      start_time: start,
      end_time: end,
    });
  }

  // Reemplazar todo si se indica (vaciar tabla)
  if (replaceAll) {
    const { error: delErr } = await supabaseAdmin.from('schedule_slots').delete().neq('id', 0);
    if (delErr) return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }

  // Insert masivo (en lotes si son muchos)
  const chunkSize = 500;
  for (let i = 0; i < toInsert.length; i += chunkSize) {
    const batch = toInsert.slice(i, i + chunkSize);
    const { error } = await supabaseAdmin.from('schedule_slots').insert(batch);
    if (error) return NextResponse.json({ ok: false, error: error.message, at: i }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: toInsert.length, replaced: replaceAll });
}
