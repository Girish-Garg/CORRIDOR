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
  const utc = useClock().toISOString().slice(11, 19)
  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-3.5">
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-bold tracking-tightest text-fg">CORRIDOR</span>
        <span className="hidden h-3 w-px bg-line sm:block" />
        <span className="hidden text-[12px] text-faint sm:block">
          Energy supply chain risk intelligence
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="meta hidden sm:inline">SCN-HORMUZ-01</span>
        <span className="meta hidden tnum md:inline">{utc} UTC</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="meta">Monitoring</span>
        </span>
      </div>
    </header>
  )
}
