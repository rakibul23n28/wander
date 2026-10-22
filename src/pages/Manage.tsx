import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiSearch,
  FiBookOpen,
  FiArrowDown,
  FiArrowUp,
} from "react-icons/fi"
import { PageShell } from "../components/layout/Layout"
import { usePosts, usePostMedia } from "../hooks/usePosts"
import { deletePost, deleteSamplePosts, getStats, type Post } from "../services/posts"
import { useUI } from "../components/ui/Context"
import { Views } from "../components/ui/Views"
function Row({ post }: { post: Post }) {
  const { image } = usePostMedia(post)
  const { toast, confirmAction, setOverlayOpen } = useUI()
  return (
    <div className="manage-row">
      <div className="manage-thumbnail">
        {image ? <img src={image} alt="" /> : <span>{post.title[0]}</span>}
      </div>
      <div className="manage-title">
        <Link to={`/write/${post.id}`}>{post.title}</Link>
        <small>
          {post.category} ·{" "}
          {new Date(post.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </small>
      </div>
      <span className={`status-chip ${post.status}`}>{post.status}</span>
      <div className="manage-views">
        <Views count={post.views} />
      </div>
      <div className="row-actions">
        <Link
          to={`/blog/${post.slug}`}
          state={{ fromOwner: true }}
          aria-label={`View ${post.title}`}
        >
          <FiEye />
        </Link>
        <Link to={`/write/${post.id}`} aria-label={`Edit ${post.title}`}>
          <FiEdit2 />
        </Link>
        <button
          aria-label={`Delete ${post.title}`}
          onClick={async () => {
            if (await confirmAction(`Delete “${post.title}”?`)) {
              await deletePost(post.id)
              toast("Story deleted.")
            }
          }}
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  )
}
export default function Manage() {
  const { posts } = usePosts()
  const { toast, confirmAction } = useUI()
  const [q, setQ] = useState("")
  const [tab, setTab] = useState("All")
  const [viewsSort, setViewsSort] = useState<"asc" | "desc" | null>(null)
  const [totalViews, setTotalViews] = useState(0)
  useEffect(() => {
    getStats()
      .then((stats) => setTotalViews(stats.totalViews ?? posts.reduce((sum, p) => sum + p.views, 0)))
      .catch(() => setTotalViews(posts.reduce((sum, p) => sum + p.views, 0)))
  }, [posts])
  const filtered = posts
    .filter(
      (p) =>
        (tab === "All" || p.status === tab.toLowerCase()) &&
        `${p.title} ${p.category}`.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) =>
      viewsSort
        ? (viewsSort === "desc" ? b.views - a.views : a.views - b.views) ||
          b.createdAt.localeCompare(a.createdAt)
        : 0,
    )
  return (
    <PageShell
      eyebrow="THE STORYKEEPER’S DESK"
      title="Your stories."
      description="A home for your ideas, drafts, and adventures."
    >
      <section className="manage-content">
        <div className="total-views">
          <span>Total views</span>
          <Views count={totalViews} />
          <small>Across all stories · live totals</small>
        </div>
        <div className="manage-heading">
          <div className="segmented">
            {["All", "Published", "Drafts"].map((t) => (
              <button
                className={
                  tab === t || (t === "Drafts" && tab === "Draft")
                    ? "selected"
                    : ""
                }
                key={t}
                onClick={() => setTab(t === "Drafts" ? "Draft" : t)}
              >
                {t}{" "}
                <small>
                  {t === "All"
                    ? posts.length
                    : posts.filter(
                        (p) =>
                          p.status ===
                          (t === "Drafts" ? "draft" : t.toLowerCase()),
                      ).length}
                </small>
              </button>
            ))}
          </div>
          <Link className="button" to="/write">
            <FiPlus /> New story
          </Link>
        </div>
        <div className="manage-tools">
          <div className="search-field">
            <FiSearch />
            <input
              placeholder="Search your stories…"
              aria-label="Search your stories"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {posts.some((p) => p.isSample) && (
            <button
              className="delete-link"
              onClick={async () => {
                if (
                  await confirmAction(
                    "Remove all sample stories? Your own stories will be kept.",
                  )
                ) {
                  await deleteSamplePosts()
                  toast("A clean page. Sample stories removed.")
                }
              }}
            >
              Remove sample posts
            </button>
          )}
        </div>
        <div className="manage-list">
          <div className="manage-columns">
            <span>Story</span>
            <span>Status</span>
            <button
              aria-label={`Sort by views ${
                viewsSort === "desc" ? "ascending" : "descending"
              }`}
              onClick={() =>
                setViewsSort(viewsSort === "desc" ? "asc" : "desc")
              }
            >
              Views {viewsSort === "asc" ? <FiArrowUp /> : <FiArrowDown />}
            </button>
            <span>Actions</span>
          </div>
          {filtered.map((p) => (
            <Row post={p} key={p.id} />
          ))}
        </div>
        {!filtered.length && (
          <div className="empty-state">
            <FiBookOpen />
            <h2>A blank page is a good beginning.</h2>
            <p>No stories found. Let’s write something.</p>
            <Link className="button" to="/write">
              Write a story
            </Link>
          </div>
        )}
        <p className="local-note">
          Your stories are synced with the blog API.
        </p>
      </section>
    </PageShell>
  )
}
