import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function CapsulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: capsule, error } = await supabase
    .from('capsules')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !capsule) {
    notFound()
  }

  const isOpen = new Date(capsule.open_at) <= new Date()

  return (
    <main className="max-w-md mx-auto p-6">
      {isOpen ? (
        <>
          <h1 className="text-2xl font-bold mb-4">你的紙條到期了</h1>
          <p className="whitespace-pre-wrap border rounded p-4">
            {capsule.content}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">還沒到開啟時間</h1>
          <p>
            這張紙條要等到{' '}
            {new Date(capsule.open_at).toLocaleString('zh-TW')}{' '}
            才能打開,先收藏這個連結,到時候再回來看。
          </p>
        </>
      )}
    </main>
  )
}