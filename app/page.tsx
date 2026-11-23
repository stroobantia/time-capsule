'use client'

import { useEffect, useState } from 'react'

type Capsule = {
  id: string
  content: string | null
  open_at: string
  shell_color: string
}

const PHOTOS = ['/background1.jpg', '/background2.jpg', '/background3.jpg']

// 換成你的 YouTube 嵌入網址:https://www.youtube.com/embed/影片ID
const FILM_URL = 'https://www.youtube.com/embed/YOUR_VIDEO_ID'
const FILM_BUTTON_TEXT = '趁等待，看《過氧》'

const COLORS = [
  { key: 'pink', hex: '#f7a8c4' },
  { key: 'orange', hex: '#ffbf94' },
  { key: 'yellow', hex: '#ffe58a' },
  { key: 'green', hex: '#a8e0c8' },
  { key: 'blue', hex: '#b8d4f5' },
  { key: 'purple', hex: '#c9b3f0' },
]

function colorHex(key: string | undefined, fallback: string) {
  return COLORS.find((c) => c.key === key)?.hex ?? fallback
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

function PhotoBackdrop({ index }: { index: number }) {
  return (
    <div className="photo-backdrop">
      {PHOTOS.map((src, i) => (
        <div
          key={src}
          className="photo-layer"
          style={{ backgroundImage: `url(${src})`, opacity: i === index ? 1 : 0 }}
        />
      ))}
    </div>
  )
}

export default function Home() {
  const [view, setView] = useState<
    'loading' | 'form' | 'sealing' | 'sealed' | 'opening' | 'opened'
  >('loading')
  const [capsule, setCapsule] = useState<Capsule | null>(null)
  const [content, setContent] = useState('')
  const [openAt, setOpenAt] = useState('')
  const [topColor, setTopColor] = useState('pink')
  const [bottomColor, setBottomColor] = useState('blue')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [filmOpen, setFilmOpen] = useState(false)
  const [calendarHint, setCalendarHint] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPhotoIndex((i) => (i + 1) % PHOTOS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // 從行事曆提醒裡的連結回來時，網址會帶 ?c=紙條編號
    const linkId = new URLSearchParams(window.location.search).get('c')
    if (linkId) {
      localStorage.setItem('capsuleId', linkId)
      window.history.replaceState({}, '', '/')
    }
    const savedId = linkId ?? localStorage.getItem('capsuleId')
    if (!savedId) {
      setView('form')
      return
    }
    fetch(`/api/capsules/${savedId}`)
      .then(async (res) => {
        if (res.ok) {
          setCapsule(await res.json())
          setView('sealed')
          return
        }
        // 只有確定資料庫裡沒有這張紙條時才清掉記憶，連線失敗時保留
        if (res.status === 404) {
          localStorage.removeItem('capsuleId')
        }
        setView('form')
      })
      .catch(() => setView('form'))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    const openIso = new Date(openAt).toISOString()

    const res = await fetch('/api/capsules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        open_at: openIso,
        shell_color: `${topColor}-${bottomColor}`,
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
      content: null,
      open_at: openIso,
      shell_color: `${topColor}-${bottomColor}`,
    })
    setView('sealing')
    setTimeout(() => {
      setView('sealed')
      setSending(false)
    }, 600)
  }

  async function handleCapsuleClick() {
    if (view !== 'sealed' || !capsule) return

    try {
      const res = await fetch(`/api/capsules/${capsule.id}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()

      if (!data.content) {
        setNotice(formatRemaining(new Date(data.open_at).getTime() - Date.now()))
        setTimeout(() => setNotice(null), 3000)
        return
      }

      setCapsule(data)
      setView('opening')
      setTimeout(() => setView('opened'), 700)
    } catch {
      setNotice('連線失敗，等一下再試試')
      setTimeout(() => setNotice(null), 3000)
    }
  }

  function handleReset() {
    localStorage.removeItem('capsuleId')
    setCapsule(null)
    setContent('')
    setOpenAt('')
    setTopColor('pink')
    setBottomColor('blue')
    setCalendarHint(false)
    setView('form')
  }

  if (view === 'loading') {
    return <main className="page-shell" />
  }

  if (view === 'form') {
    return (
      <main className="page-shell">
        <PhotoBackdrop index={photoIndex} />
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
          <div className="shell-picker">
            {[
              { label: '上半', value: topColor, set: setTopColor },
              { label: '下半', value: bottomColor, set: setBottomColor },
            ].map((row) => (
              <div className="shell-row" key={row.label}>
                <span className="shell-label">{row.label}</span>
                {COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.key}
                    className={`shell-dot ${row.value === c.key ? 'is-selected' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => row.set(c.key)}
                    aria-label={`${row.label}${c.key}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <button className="note-button" disabled={sending}>
            封存這張紙條
          </button>
        </form>
      </main>
    )
  }

  if (view === 'sealing') {
    return (
      <main className="page-shell">
        <PhotoBackdrop index={photoIndex} />
        <div className="paper-note note-suck">
          <p className="note-title">封存中⋯⋯</p>
        </div>
      </main>
    )
  }

  const [topKey, bottomKey] = (capsule?.shell_color ?? '').split('-')
  const shellTop = colorHex(topKey, '#f7a8c4')
  const shellBottom = colorHex(bottomKey, '#b8d4f5')

  return (
    <main className="page-shell">
      <PhotoBackdrop index={photoIndex} />
      <div className="capsule-scene">
        {view !== 'opened' && (
          <>
            <div
              className={`gacha capsule-pop ${view === 'opening' ? 'is-open' : ''}`}
              style={
                {
                  '--capsule-top': shellTop,
                  '--capsule-bottom': shellBottom,
                } as React.CSSProperties
              }
              onClick={handleCapsuleClick}
            >
              <div className="gacha-top" />
              <div className="gacha-shine" />
              <div className="gacha-bottom" />
            </div>
            <p className="capsule-hint">點一下扭蛋看看</p>
            {view === 'sealed' && (
              <>
                <button className="film-button" onClick={() => setFilmOpen(true)}>
                  {FILM_BUTTON_TEXT}
                </button>
                <a
                  className="film-button calendar-button"
                  href={`/api/capsules/${capsule?.id}/calendar`}
                  onClick={() => setCalendarHint(true)}
                >
                  加入行事曆提醒
                </a>
                {calendarHint && (
                  <p className="capsule-hint calendar-hint">
                    已下載行事曆檔案。請點開它並選「加入」，提醒才會進到你的行事曆。
                    手機如果沒有自動跳出來，到「下載」裡找 time-capsule.ics。
                  </p>
                )}
              </>
            )}
          </>
        )}

        {view === 'opened' && capsule && (
          <div className="paper-note capsule-pop">
            <p className="note-title">紙條到期了</p>
            <p className="note-content">{capsule.content}</p>
            <button className="note-button" onClick={handleReset}>
              封存下一張
            </button>
          </div>
        )}

        {notice && <div className="notice-bubble">{notice}</div>}
      </div>

      {filmOpen && (
        <div className="modal-backdrop" onClick={() => setFilmOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setFilmOpen(false)}>
              關閉
            </button>
            <iframe
              className="modal-video"
              src={FILM_URL}
              title="過氧"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </main>
  )
}
