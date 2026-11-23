import { supabaseAdmin } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { content, open_at, shell_color } = await req.json()

  if (!content || !open_at) {
    return NextResponse.json({ error: '缺少欄位' }, { status: 400 })
  }

  if (String(content).length > 2000 || Number.isNaN(Date.parse(open_at))) {
    return NextResponse.json({ error: '格式不正確' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('capsules')
    .insert({
      content,
      open_at,
      shell_color: String(shell_color ?? 'pink').slice(0, 30),
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: '儲存失敗' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}