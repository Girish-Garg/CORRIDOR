import { ReactNode } from "react"

export function SectionLabel({ title, right }: { n?: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <span className="meta">{title}</span>
      {right}
    </div>
  )
}
