'use client'

import { useState } from 'react'

export default function Home() {
  const [content, setContent] = useState('')
  const [email, setEmail] = useState('')
  const [openAt, setOpenAt] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const [capsuleId, setCapsuleId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')

    const res = await fetch('/api/capsules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, email, open_at: new Date(openAt).toISOString() }),
    })

    if (res.ok) {
      const data = await res.json()
      setCapsuleId(data.id)
      setStatus('done')
    } else {
      setStatus('idle')
      alert('送出失敗,再試一次')
    }
  }

  if (status === 'done' && capsuleId) {
    return (
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">封存好了
        </h1>
        <p className="mb-2">收藏這個連結,時間到了再回來打開:</p>
        <a
          className="text-blue-600 underline break-all"
          href={`/capsule/${capsuleId}`}
        >
          {`localhost:3000/capsule/${capsuleId}`}
        </a>
      </main>
    )
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">寫一張給未來的紙條</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          className="border rounded p-2"
          placeholder="想對未來的自己說什麼?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          required
        />
        <input
          className="border rounded p-2"
          type="email"
          placeholder="你的 email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="text-sm text-gray-600">
          什麼時候開啟?
          <input
            className="border rounded p-2 w-full mt-1"
            type="datetime-local"
            value={openAt}
            onChange={(e) => setOpenAt(e.target.value)}
            required
          />
        </label>
        <button
          className="bg-black text-white rounded p-2 disabled:opacity-50"
          disabled={status === 'sending'}
        >
          封存這張紙條
        </button>
      </form>
    </main>
  )
}