import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { FiSearch, FiX, FiArrowDown, FiBookOpen } from "react-icons/fi"
import { motion } from "framer-motion"
import { PageShell } from "../components/layout/Layout"
import { PostCard, PostUnit } from "../components/tiles/Tiles"
import { usePosts } from "../hooks/usePosts"
import { month } from "../lib/utils"
export default function Blog() {
  const { posts, loading } = usePosts()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get("q") || "")
  const [limit, setLimit] = useState(9)
  const [shimmer, setShimmer] = useState(true)
  const category = params.get("category") || "All",
    sort = params.get("sort") || "newest"
  useEffect(() => {
    const t = setTimeout(() => setShimmer(false), 400)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    const t = setTimeout(() => {
      if (q === (params.get("q") || "")) return
      const next = new URLSearchParams(params)
      q ? next.set("q", q) : next.delete("q")
      setParams(next, { replace: true })
      setLimit(9)
    }, 250)
    return () => clearTimeout(t)
  }, [q, params])
  useEffect(() => setQ(params.get("q") || ""), [params.get("q")])
  const all = posts.filter((p) => p.status === "published")
  const categories = [...new Set(all.map((p) => p.category))]
  const popularIds = new Set(
    [...all]
      .sort(
        (a, b) => b.views - a.views || b.createdAt.localeCompare(a.createdAt),
      )
      .slice(0, 3)
      .map((p) => p.id),
  )
  function update(key: string, value: string) {
    const p = new URLSearchParams(params)
    value === "All" || value === "newest" ? p.delete(key) : p.set(key, value)
    setParams(p)
    setLimit(9)
  }
  const filtered = useMemo(
    () =>
      all
        .filter(
          (p) =>
            (category === "All" || p.category === category) &&
            `${p.title} ${p.excerpt} ${p.tags.join(" ")}`
              .toLowerCase()
              .includes((params.get("q") || "").toLowerCase()),
        )
        .sort((a, b) =>
          sort === "views"
            ? b.views - a.views || b.createdAt.localeCompare(a.createdAt)
            : sort === "az"
              ? a.title.localeCompare(b.title)
              : sort === "oldest"
                ? a.createdAt.localeCompare(b.createdAt)
                : b.createdAt.localeCompare(a.createdAt),
        ),
    [posts, params],
  )
  const hero =
    !params.get("q") && category === "All" && sort === "newest"
      ? filtered.find((p) => p.featured) || filtered[0]
      : undefined
  const rest = filtered.filter((p) => p.id !== hero?.id).slice(0, limit)
  const groups = rest.reduce<Record<string, typeof rest>>((acc, p) => {
    const key =
      sort === "az" || sort === "views"
        ? sort === "views"
          ? "Most viewed stories"
          : "All stories"
        : new Date(p.createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
    ;(acc[key] ??= []).push(p)
    return acc
  }, {})
  return (
    <PageShell
      eyebrow="THE JOURNAL"
      title="All stories."
      description={<>{all.length} stories, a world of little discoveries.</>}
    >
      <div className="filter-bar">
        <div className="search-field">
          <FiSearch />
          <input
            aria-label="Search stories"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a story…"
          />
          {q && (
            <button aria-label="Clear search" onClick={() => setQ("")}>
              <FiX />
            </button>
          )}
        </div>
        <div className="filter-chips">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              className={`chip ${c === category ? "selected" : ""}`}
              onClick={() => update("category", c)}
            >
              {c}
              <small>
                {c === "All"
                  ? all.length
                  : all.filter((p) => p.category === c).length}
              </small>
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
          aria-label="Sort stories"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A–Z</option>
          <option value="views">Most viewed</option>
        </select>
      </div>
      {loading || shimmer ? (
        <div className="skeleton-grid">
          {[1, 2, 3].map((n) => (
            <div className="skeleton" key={n} />
          ))}
        </div>
      ) : (
        <>
          {hero && (
            <div className="blog-hero">
              <PostUnit
                post={hero}
                horizontal
                trending={popularIds.has(hero.id)}
              />
            </div>
          )}
          <div className="blog-results">
            {Object.entries(groups).map(([label, group]) => (
              <section
                key={label}
                data-scroll-label={month(group[0].createdAt)}
                data-scroll-date={group[0].createdAt}
              >
                <div className="month-heading">
                  <h2>{label}</h2>
                  <span>
                    {group.length} {group.length === 1 ? "story" : "stories"}
                  </span>
                  <i />
                </div>
                <div className="post-grid">
                  {group.map((p) => (
                    <motion.div
                      layout
                      transition={{ duration: 0.25 }}
                      key={p.id}
                    >
                      <PostCard post={p} trending={popularIds.has(p.id)} />
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
            {!filtered.length && (
              <div className="empty-state">
                <FiBookOpen />
                <h2>No stories down this road.</h2>
                <p>Try another search or take the scenic route.</p>
                <button
                  className="button"
                  onClick={() => {
                    setParams({})
                    setQ("")
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
            {filtered.length - (hero ? 1 : 0) > limit && (
              <button
                className="button load-more"
                onClick={() => setLimit(limit + 9)}
              >
                A few more stories <FiArrowDown />
              </button>
            )}
          </div>
        </>
      )}
    </PageShell>
  )
}
