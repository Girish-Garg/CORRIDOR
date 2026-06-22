import { useEffect, useState } from "react"

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function Header() {
  const now = useClock()
  const utc = now.toISOString().slice(11, 19)
  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-4">
      <div className="flex items-center gap-3">
        <Logo />
        <div className="leading-none">
          <div className="font-display text-[19px] font-extrabold tracking-tight text-ink">
            CORRIDOR
          </div>
          <div className="label mt-1.5">Energy Supply Chain Risk Intelligence</div>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="label">Theatre</span>
          <span className="mono text-[12px] text-amber">STRAIT OF HORMUZ</span>
        </div>
        <div className="hidden h-7 w-px bg-line sm:block" />
        <div className="mono hidden text-[12px] tnum text-dim md:block">{utc} UTC</div>
        <div className="flex items-center gap-2">
          <span className="dot" />
          <span className="label !text-amber">Live Monitoring</span>
        </div>
      </div>
    </header>
  )
}

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="29" height="29" stroke="#2e3947" />
      <path d="M7 20 L13 10 L17 16 L23 8" stroke="#f4a32b" strokeWidth="1.6" />
      <circle cx="23" cy="8" r="2" fill="#f4a32b" />
      <path d="M7 23 H23" stroke="#36cfc0" strokeWidth="1.2" strokeDasharray="2 2" />
    </svg>
  )
}
