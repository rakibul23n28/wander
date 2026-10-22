import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { useUI } from "../ui/Context"
import { usePosts } from "../../hooks/usePosts"
export function CustomScrollbar() {
  const { pathname } = useLocation()
  const { posts } = usePosts()
  const newestYear = posts.length
    ? new Date(posts[0].createdAt).getFullYear()
    : new Date().getFullYear()
  const { modal, overlayOpen } = useUI()
  const ref = useRef<HTMLDivElement>(null)
  const [info, setInfo] = useState({
    y: 0,
    value: 0,
    visible: false,
    label: "Home",
  })
  const [active, setActive] = useState(false)
  const drag = useRef<{
    y: number
    scroll: number
  } | null>(null)
  useEffect(() => {
    let raf = 0
    let timeout: ReturnType<typeof setTimeout>
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight
        let label =
          pathname === "/" ? "Home" : pathname.split("/")[1] || "Journal"
        document
          .querySelectorAll<HTMLElement>("[data-scroll-label]")
          .forEach((el) => {
            if (el.getBoundingClientRect().top < innerHeight * 0.35) {
              label = el.dataset.scrollLabel || label
              const date = el.dataset.scrollDate
              if (date && new Date(date).getFullYear() !== newestYear) {
                label = `${new Date(date).toLocaleDateString("en-US", { month: "short" })} ’${String(new Date(date).getFullYear()).slice(-2)}`
              }
            }
          })
        setInfo({
          y: max > 0 ? (scrollY / max) * (innerHeight - 128) + 8 : 0,
          value: max > 0 ? Math.round((scrollY / max) * 100) : 0,
          visible: max > 0,
          label,
        })
      })
    }
    const scroll = () => {
      update()
      setActive(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => setActive(false), 1200)
    }
    const ro = new ResizeObserver(update)
    ro.observe(document.body)
    addEventListener("scroll", scroll, { passive: true })
    addEventListener("resize", update)
    update()
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      clearTimeout(timeout)
      removeEventListener("scroll", scroll)
      removeEventListener("resize", update)
    }
  }, [pathname, newestYear])
  if (!info.visible || modal || overlayOpen) return null
  const jump = (y: number) =>
    window.scrollTo({
      top:
        Math.max(0, Math.min(1, (y - 56) / (innerHeight - 112))) *
        (document.documentElement.scrollHeight - innerHeight),
    })
  return (
    <div
      className="scroll-track"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) jump(e.clientY)
      }}
    >
      <div
        ref={ref}
        className={`scroll-thumb ${active ? "active" : ""}`}
        style={{ transform: `translateY(${info.y}px)` }}
        role="scrollbar"
        aria-controls="root"
        aria-label="Page scroll"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={info.value}
        tabIndex={0}
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, scroll: scrollY }
          e.currentTarget.setPointerCapture(e.pointerId)
          setActive(true)
        }}
        onPointerMove={(e) => {
          if (drag.current)
            scrollTo(
              0,
              drag.current.scroll +
                ((e.clientY - drag.current.y) / (innerHeight - 128)) *
                  (document.documentElement.scrollHeight - innerHeight),
            )
        }}
        onPointerUp={() => {
          drag.current = null
          setActive(false)
        }}
        onPointerCancel={() => {
          drag.current = null
          setActive(false)
        }}
        onKeyDown={(e) => {
          const moves: Record<string, number> = {
            ArrowDown: 60,
            ArrowUp: -60,
            PageDown: innerHeight * 0.85,
            PageUp: -innerHeight * 0.85,
          }
          if (e.key in moves) {
            e.preventDefault()
            scrollBy(0, moves[e.key])
          }
          if (e.key === "Home") {
            e.preventDefault()
            scrollTo(0, 0)
          }
          if (e.key === "End") {
            e.preventDefault()
            scrollTo(0, document.body.scrollHeight)
          }
        }}
      >
        <span key={info.label}>{info.label}</span>
      </div>
    </div>
  )
}
