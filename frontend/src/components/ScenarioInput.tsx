import { useState } from "react"

const PRESETS = [
  "Strait of Hormuz full closure",
  "Red Sea Houthi attacks disrupt Bab-el-Mandeb",
  "New sanctions tighten Russian crude supply",
  "OPEC+ emergency production cut tightens supply",
]

export function ScenarioInput({
  loading,
  onSubmit,
}: {
  loading: boolean
  onSubmit: (text: string) => void
}) {
  const [text, setText] = useState("")

  function submit(value: string) {
    const v = value.trim()
    if (v && !loading) onSubmit(v)
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            submit(text)
          }
        }}
        placeholder="Describe a disruption…"
        rows={2}
        className="w-full resize-none rounded-md border border-line2 bg-surface2 px-3 py-2 text-[14px] text-fg placeholder:text-faint focus:border-accent focus:outline-none"
      />
      <button
        onClick={() => submit(text)}
        disabled={loading}
        className="mt-2 w-full rounded-md border border-line2 bg-surface2 px-4 py-2.5 text-[14px] font-semibold text-fg transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {loading ? "Running…" : "Run scenario"}
      </button>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setText(p)
              submit(p)
            }}
            disabled={loading}
            className="mono rounded border border-line px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {p.split(" ").slice(0, 2).join(" ")}…
          </button>
        ))}
      </div>
    </div>
  )
}
