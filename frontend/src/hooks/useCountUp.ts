import { useEffect, useRef, useState } from "react"

// Counts from 0 to target with an ease-out cubic, restarting whenever
// target or runKey changes. Used for the instrument readouts.
export function useCountUp(target: number, runKey: number, durationMs = 900): number {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isFinite(target)) {
      setValue(target)
      return
    }
    let raf = 0
    startRef.current = null
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const p = Math.min((t - startRef.current) / durationMs, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(target * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, runKey, durationMs])

  return value
}
