import { useEffect, useRef, useState } from "react"

// Animates 0 to target on a new run (runKey change), and snaps to the new
// value when the target changes within the same run (slider re-runs), so
// dragging a slider does not re-trigger the count-up each time.
export function useCountUp(target: number, runKey: number, durationMs = 900): number {
  const [value, setValue] = useState(0)
  const prevRun = useRef<number>(-1)

  useEffect(() => {
    if (!isFinite(target)) {
      setValue(target)
      return
    }
    if (prevRun.current === runKey) {
      setValue(target)
      return
    }
    prevRun.current = runKey
    let raf = 0
    let startT: number | null = null
    const step = (t: number) => {
      if (startT === null) startT = t
      const p = Math.min((t - startT) / durationMs, 1)
      setValue(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, runKey, durationMs])

  return value
}
