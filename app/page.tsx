'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Capsule = {
  id: string
  content: string
  email: string
  open_at: string
}

function formatRemaining(ms: number) {
  const totalMinutes = Math.max(1, Math.round(ms / 60000))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `還要等 ${days} 天 ${hours} 小時`
  if (hours > 0) return `還要等 ${hours} 小時 ${minutes} 分`
  return `還要等 ${minutes} 分鐘`
}

export default function Home() {
  const [view, setView] = useState
  <
    'loading' | 'form' | 'sealing' | 'sealed' | 'opening' | 'opened'
  >('loading')
  const [capsule, setCapsule] = useState<Capsule | null>(null)
  const [content, setContent] = useState('')
  const [email, setEmail] = useState('')
  const [openAt, setOpenAt] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const savedId = localStorage.getItem('capsuleId')
    if (!savedId) {
      setView('form')
      return
    }

    supabase
      .from('capsules')
      .select('*')
      .eq('id', savedId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          localStorage.removeItem('capsuleId')
          setView('form')
        } else {
          setCapsule(data)
          setView('sealed')
        }
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)

    const res = await fetch('/api/capsules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        email,
        open_at: new Date(openAt).toISOString(),
      }),
    })

    if (!res.ok) {
      setSending(false)
      alert('送出失敗,再試一次')
      return
    }

    const data = await res.json()
    localStorage.setItem('capsuleId', data.id)
    setCapsule({
      id: data.id,
      content,
      email,
      open_at: new Date(openAt).toISOString(),
    })

    setView('sealing')
    setTimeout(() => {
      setView('sealed')
      setSending(false)
    }, 600)
  }

  function handleCapsuleClick() {
    if (view !== 'sealed' || !capsule) return

    const isReady = new Date(capsule.open_at) <= new Date()

    if (!isReady) {
      setNotice(
        formatRemaining(new Date(capsule.open_at).getTime() - Date.now())
      )
      setTimeout(() => setNotice(null), 3000)
      return
    }

    setView('opening')
    setTimeout(() => setView('opened'), 700)
  }

  function handleReset() {
    localStorage.removeItem('capsuleId')
    setCapsule(null)
    setContent('')
    setEmail('')
    setOpenAt('')
    setView('form')
  }

  if (view === 'loading') {
    return <main className="page-shell" />
  }

  if (view === 'form') {
    return (
      <main className="page-shell">
        <div className="photo-backdrop" />
        <form onSubmit={handleSubmit} className="paper-note">
          <h1 className="note-title">寫一張給未來的紙條</h1>
          <textarea
            className="note-textarea"
            placeholder="想對未來的自己說什麼?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            required
          />
          <input
            className="note-input"
            type="email"
            placeholder="你的名字"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="note-label">
            什麼時候開啟?
            <input
              className="note-input"
              type="datetime-local"
              value={openAt}
              onChange={(e) => setOpenAt(e.target.value)}
              required
            />
          </label>
          <button className="note-button" disabled={sending}>
            埋下時光膠囊
          </button>
        </form>
      </main>
    )
  }

  if (view === 'sealing') {
    return (
      <main className="page-shell">
        <div className="photo-backdrop" />
        <div className="paper-note note-suck">
          <p className="note-title">封存中⋯⋯</p>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div className="photo-backdrop" />
      <div className="capsule-scene">
        {view !== 'opened' && (
          <>
            <div
              className={`gacha capsule-pop ${view === 'opening' ? 'is-open' : ''}`}
              onClick={handleCapsuleClick}
            >
              <div className="gacha-top" />
              <div className="gacha-shine" />
              <div className="gacha-bottom" />
            </div>
            <p className="capsule-hint">打開時光膠囊</p>
          </>
        )}

        {view === 'opened' && capsule && (
          <div className="paper-note capsule-pop">
            <p className="note-title">膠囊打開啦</p>
            <p className="note-content">{capsule.content}</p>
            <button className="note-button" onClick={handleReset}>
              封存下一份
            </button>
          </div>
        )}

        {notice && <div className="notice-bubble">{notice}</div>}
      </div>
    </main>
  )
}