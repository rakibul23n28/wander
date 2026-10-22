import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  FiCopy,
  FiShare2,
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi"
import { FaFacebookF } from "react-icons/fa"
import { PageShell, Socials } from "../components/layout/Layout"
import { Meta, PostCard, SmartImage } from "../components/tiles/Tiles"
import { YouTubeEmbed } from "../components/ui/VideoModal"
import { useUI } from "../components/ui/Context"
import { usePostMedia, usePosts } from "../hooks/usePosts"
import { deletePost, type Post } from "../services/posts"
import { sanitize, month } from "../lib/utils"
import { site } from "../config/site"
import { incrementView } from "../services/views"
export function NotFound() {
  return (
    <PageShell
      eyebrow="THE UNEXPECTED DETOUR"
      title="This tile went missing."
      description="Even the best adventures take a wrong turn."
    >
      <div className="not-found">
        <span>404</span>
        <Link className="button" to="/">
          Find your way home <FiArrowRight />
        </Link>
      </div>
    </PageShell>
  )
}
export function PostView({
  post,
  preview = false,
}: {
  post: Post
  preview?: boolean
}) {
  const { image, video } = usePostMedia(post)
  const { toast, isOwner, confirmAction } = useUI()
  const { posts } = usePosts()
  const navigate = useNavigate()
  const published = posts.filter((p) => p.status === "published")
  const index = published.findIndex((p) => p.id === post.id)
  const related = published
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3)
  return (
    <PageShell
      eyebrow={`${
        post.status === "draft" ? "DRAFT · " : ""
      }${post.category.toUpperCase()}`}
      title={post.title}
      description={
        <>
          <div className="post-author-meta">
            <img src={site.avatar} alt="" />
            <span>{site.authorName}</span>
            <Meta post={post} animateViews={!preview} />
          </div>
          {isOwner && !preview && (
            <div className="owner-actions">
              <Link to={`/write/${post.id}`}>
                <FiEdit2 /> Edit story
              </Link>
              <button
                onClick={async () => {
                  if (
                    await confirmAction(
                      "Delete this story? This cannot be undone.",
                    )
                  ) {
                    await deletePost(post.id)
                    toast("Story deleted.")
                    navigate("/blog")
                  }
                }}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          )}
        </>
      }
    >
      <div
        className="post-hero"
        data-scroll-label={month(post.createdAt)}
        data-scroll-date={post.createdAt}
      >
        {post.media.type === "youtube" ? (
          <YouTubeEmbed id={post.media.youtubeId || ""} />
        ) : post.media.type === "video" ? (
          <video controls playsInline src={video} poster={image} />
        ) : image ? (
          <SmartImage
            src={image}
            alt={post.media.previewImage?.alt || post.title}
            slug={post.slug}
          />
        ) : null}
      </div>
      <div className="article-wrap">
        <aside className="share-rail">
          <span>SHARE</span>
          <button
            aria-label="Copy link"
            onClick={() => {
              navigator.clipboard?.writeText(location.href)
              toast("Story link copied.")
            }}
          >
            <FiCopy />
          </button>
          <a
            aria-label="Share on Facebook"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFacebookF />
          </a>
          {!!navigator.share && (
            <button
              aria-label="Share story"
              onClick={() =>
                navigator
                  .share({ title: post.title, url: location.href })
                  .catch(() => {})
              }
            >
              <FiShare2 />
            </button>
          )}
        </aside>
        <article className="post-body">
          <div
            className="post-prose"
            dangerouslySetInnerHTML={{ __html: sanitize(post.content) }}
          />
          <div className="tag-row">
            {post.tags.map((tag) => (
              <Link
                className="chip"
                key={tag}
                to={`/blog?q=${encodeURIComponent(tag)}`}
              >
                {tag}
              </Link>
            ))}
          </div>
          <div className="author-card">
            <img src={site.avatar} alt={site.authorName} />
            <div>
              <small>WORDS & WANDERINGS BY</small>
              <h3>{site.authorName}</h3>
              <p>{site.bio}</p>
              <Socials />
            </div>
          </div>
        </article>
      </div>
      {!preview && (
        <>
          <div className="prev-next">
            {[published[index + 1], published[index - 1]].map((p, i) =>
              p ? (
                <Link to={`/blog/${p.slug}`} key={p.id}>
                  <span>
                    {i === 0 ? <FiArrowLeft /> : <FiArrowRight />}{" "}
                    {i === 0 ? "Previous story" : "Next story"}
                  </span>
                  <h2>{p.title}</h2>
                </Link>
              ) : (
                <div key={i} />
              ),
            )}
          </div>
          {related.length > 0 && (
            <section className="more-stories">
              <span className="eyebrow">THE JOURNEY CONTINUES</span>
              <h2>More stories to get lost in.</h2>
              <div className="post-grid">
                {related.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PageShell>
  )
}
export default function PostPage() {
  const { state } = useLocation()
  const { slug } = useParams()
  const counted = useRef(new Set<string>())
  const [visibleViews, setVisibleViews] = useState<{
    id: string
    count: number
  } | null>(null)
  const { posts, loading } = usePosts()
  const { isOwner } = useUI()
  const post = posts.find(
    (p) => p.slug === slug && (p.status === "published" || isOwner),
  )
  useEffect(() => {
    if (
      !post ||
      post.status !== "published" ||
      (isOwner && state?.fromOwner) ||
      counted.current.has(post.id)
    )
      return
    counted.current.add(post.id)
    incrementView(post.id)
      .then((count) => setVisibleViews({ id: post.id, count }))
      .catch(() => {
        // A failed local write should not prevent reading the story.
        counted.current.delete(post.id)
      })
  }, [post?.id, post?.status, isOwner, state?.fromOwner])
  useEffect(() => {
    if (post) document.title = `${post.title} — ${site.brandName}`
  }, [post])
  if (loading) return <div className="skeleton" />
  return post ? (
    <PostView
      post={
        visibleViews?.id === post.id
          ? { ...post, views: Math.max(post.views, visibleViews.count) }
          : post
      }
    />
  ) : (
    <NotFound />
  )
}
