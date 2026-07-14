import { useEffect, useState } from 'react'

export function useCountUp(target: number, duration = 900, enabled = true) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setValue(target)
      return
    }

    let start: number | null = null
    let frame: number
    const from = 0

    const step = (ts: number) => {
      if (start === null) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, enabled])

  return value
}
