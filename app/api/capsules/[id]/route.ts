import { supabaseAdmin } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  const { content, email, open_at, shell_color } = await req.json()

  if (!content || !email || !open_at) {
    return NextResponse.json({ error: '缺少欄位' }, { status: 400 })
  }

  if (
    String(content).length > 2000 ||
    !EMAIL_RE.test(String(email)) ||
    Number.isNaN(Date.parse(open_at))
  ) {
    return NextResponse.json({ error: '格式不正確' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('capsules')
    .insert({
      content,
      email,
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