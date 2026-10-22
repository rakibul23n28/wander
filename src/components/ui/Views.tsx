import { useEffect, useRef, useState } from "react"
import { FiEye } from "react-icons/fi"

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const full = new Intl.NumberFormat("en-US")

export function Views({
  count = 0,
  animate = false,
}: {
  count: number
  animate?: boolean
}) {
  const [display, setDisplay] = useState(animate ? 0 : count)
  const current = useRef(display)
  useEffect(() => {
    if (!animate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = count
      setDisplay(count)
      return
    }
    const from = current.current
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 600)
      current.current = Math.round(
        from + (count - from) * (1 - (1 - progress) ** 3),
      )
      setDisplay(current.current)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [count, animate])
  const label = `${full.format(count)} views`
  return (
    <span className="views-count" aria-label={label} title={label}>
      <FiEye aria-hidden="true" />
      <span aria-hidden="true">
        {compact.format(animate ? display : count)}
      </span>
    </span>
  )
}
