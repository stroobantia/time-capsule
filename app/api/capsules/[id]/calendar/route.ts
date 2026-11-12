import { supabaseAdmin } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

function toIcsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 只取開啟時間，不會碰到紙條內容
  const { data, error } = await supabaseAdmin
    .from('capsules')
    .select('id, open_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const link = `${new URL(req.url).origin}/?c=${data.id}`
  const start = new Date(data.open_at)
  const end = new Date(start.getTime() + 30 * 60 * 1000)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Time Capsule//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${data.id}@time-capsule`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    'SUMMARY:你的時光膠囊可以開啟了',
    `DESCRIPTION:點這個連結回到網站打開你的扭蛋 ${link}`,
    `URL:${link}`,
    'BEGIN:VALARM',
    'TRIGGER:PT0S',
    'ACTION:DISPLAY',
    'DESCRIPTION:你的時光膠囊可以開啟了',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="time-capsule.ics"',
    },
  })
}