import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { content, email, open_at } = await req.json()

  if (!content || !email || !open_at) {
    return NextResponse.json({ error: '缺少欄位' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('capsules')
    .insert({ content, email, open_at })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}