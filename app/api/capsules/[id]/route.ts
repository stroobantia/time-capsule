import { supabaseAdmin } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('capsules')
    .select('id, content, open_at, shell_color')
    .eq('id', id)
    .maybeSingle()

  // 22P02 = 網址裡的 id 格式不對，視為找不到
  if (error?.code === '22P02' || (!error && !data)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (error || !data) {
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  const isOpen = new Date(data.open_at) <= new Date()

  // 沒到時間就不回傳內容，也永遠不回傳 email
  return NextResponse.json({
    id: data.id,
    open_at: data.open_at,
    shell_color: data.shell_color,
    content: isOpen ? data.content : null,
  })
}