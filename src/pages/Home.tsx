import { useEffect, useMemo, useRef, useState } from "react"
import { NavBlock } from "../components/layout/Layout"
import { FillerTile, PostUnit } from "../components/tiles/Tiles"
import { usePosts } from "../hooks/usePosts"
import { mulberry32 } from "../lib/utils"
export default function Home() {
  const { posts } = usePosts()
  const [seed, setSeed] = useState(() => Date.now())
  const [width, setWidth] = useState(1440)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const ob = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    if (ref.current) ob.observe(ref.current)
    return () => ob.disconnect()
  }, [])
  const cols =
    width < 640 ? 1 : Math.max(2, Math.min(5, Math.floor(width / 340)))
  const published = posts.filter((p) => p.status === "published").slice(0, 12)
  const { units, fillers } = useMemo(() => {
    const random = mulberry32(seed)
    const heights = Array(cols).fill(0)
    heights[0] = 1
    const units = published.map((post, index) => {
      const desireHorizontal = random() > 0.42
      const reverse = random() > 0.5
      const r = random()
      const variant = r < 0.2 ? 1 : r > 0.85 ? 2 : 0
      const c = heights.indexOf(Math.min(...heights))
      const row = heights[c]
      const horizontal =
        cols > 1 &&
        desireHorizontal &&
        c + 1 < cols &&
        heights[c] === heights[c + 1]
      if (horizontal) {
        heights[c]++
        heights[c + 1]++
      } else heights[c] += 2
      return {
        post,
        horizontal,
        reverse,
        variant,
        c,
        row,
        index,
        aspect: [1, 4 / 3, 4 / 5][Math.floor(random() * 3)],
      }
    })
    const fillers: {
      c: number
      row: number
    }[] = []
    const max = Math.max(...heights)
    while (Math.min(...heights) < max) {
      const c = heights.indexOf(Math.min(...heights))
      fillers.push({ c, row: heights[c] })
      heights[c]++
    }
    return { units, fillers }
  }, [posts, seed, cols])
  return (
    <main className="home">
      <div
        className="mosaic"
        ref={ref}
        style={
          {
            "--cell": `${width / cols}px`,
            gridTemplateColumns: `repeat(${cols},1fr)`,
          } as React.CSSProperties
        }
      >
        <div className="nav-cell">
          <NavBlock shuffle={() => setSeed(Date.now())} />
        </div>
        {units.map((u) => (
          <PostUnit
            key={`${seed}-${u.post.id}`}
            post={u.post}
            horizontal={u.horizontal}
            reverse={u.reverse}
            variant={u.variant}
            style={
              cols > 1
                ? {
                    gridColumn: `${u.c + 1} / span ${u.horizontal ? 2 : 1}`,
                    gridRow: `${u.row + 1} / span ${u.horizontal ? 1 : 2}`,
                    animationDelay: `${Math.min(u.index * 35, 350)}ms`,
                  }
                : { "--mobile-aspect": u.aspect } as React.CSSProperties
            }
          />
        ))}
        {cols > 1 &&
          fillers.map((f, i) => (
            <div
              key={`f${i}`}
              style={{ gridColumn: f.c + 1, gridRow: f.row + 1 }}
            >
              <FillerTile index={i} />
            </div>
          ))}
      </div>
      <div className="home-end">
        <span>A collection of places, people, and little things.</span>
        <span>KEEP WANDERING ↗</span>
      </div>
    </main>
  )
}
