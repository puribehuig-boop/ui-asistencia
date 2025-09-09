import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

function checkAuth(req: Request) {
  const pass = req.headers.get('x-admin-password') ?? '';
  return pass && pass === process.env.ADMIN_UI_PASSWORD;
}

// Remueve BOM si existe
function stripBOM(s: string) {
  return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
}

// Detecta delimitador por la cabecera (coma o punto y coma)
function detectDelimiter(headerLine: string) {
  const commas = (headerLine.match(/,/g) || []).length;
  const semis  = (headerLine.match(/;/g) || []).length;
  return semis > commas ? ';' : ',';
}

// Divide una línea CSV respetando comillas dobles
function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      const next = line[i + 1];
      if (inQ && next === '"') {
        cur += '"'; // comilla escapada
        i++;
      } else {
        inQ = !inQ;
      }
      continue;
    }

    if (ch === delim && !inQ) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function parseCsv(text: string) {
  const clean = stripBOM(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const delim = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delim).map(h => h.replace(/^"|"$/g, '').trim());

  const rows = lines.slice(1).map(line => {
    const cols = splitCsvLine(line, delim).map(c => c.replace(/^"|"$/g, '').trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
    return obj;
  });

  return { headers, rows };
}

// Normaliza horas: acepta "HH:MM", "HH:MM:SS", "H:MM", "0800"
function normalizeTime(val: string): string | null {
  const s = val.trim();
  // HH:MM:SS → HH:MM
  let m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m) {
    const h = String(m[1]).padStart(2, '0');
    const mm = m[2];
    return `${h}:${mm}`;
  }
  // 0800 o 800 → HHMM
  m = s.match(/^(\d{3,4})$/);
  if (m) {
    const num = m[1].padStart(4, '0');
    return `${num.slice(0,2)}:${num.slice(2,4)}`;
  }
  return null;
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

  const toInsert: any[] = [];
  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    if (!r.room_code && !r.subject) continue; // ignora filas vacías

    const weekday = Number((r.weekday || '').trim());
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return NextResponse.json({ ok: false, error: 'invalid_weekday', row: r, at: idx + 2 }, { status: 400 });
    }

    const normStart = normalizeTime(String(r.start_time || ''));
    const normEnd   = normalizeTime(String(r.end_time   || ''));
    if (!normStart || !normEnd) {
      return NextResponse.json({ ok: false, error: 'invalid_time_format', row: r, at: idx + 2 }, { status: 400 });
    }

    toInsert.push({
      room_code: r.room_code,
      subject: r.subject,
      group_name: r.group_name,
      weekday,
      start_time: normStart, // HH:MM
      end_time: normEnd,     // HH:MM
    });
  }

  if (replaceAll) {
    const { error: delErr } = await supabaseAdmin.from('schedule_slots').delete().neq('id', 0);
    if (delErr) return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }

  const chunkSize = 500;
  for (let i = 0; i < toInsert.length; i += chunkSize) {
    const batch = toInsert.slice(i, i + chunkSize);
    const { error } = await supabaseAdmin.from('schedule_slots').insert(batch);
    if (error) return NextResponse.json({ ok: false, error: error.message, at: i }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: toInsert.length, replaced: replaceAll });
}

