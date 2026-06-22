import { ReactNode } from "react"

export function SectionLabel({ n, title, right }: { n: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <div className="flex items-baseline gap-2">
        <span className="mono text-[11px] tnum text-faintest">{n}</span>
        <span className="meta">{title}</span>
      </div>
      {right}
    </div>
  )
}
