import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { FaFire } from "react-icons/fa"
import {
  FiArrowUpRight,
  FiCalendar,
  FiFolder,
  FiClock,
  FiPlay,
  FiArrowRight,
} from "react-icons/fi"
import type { Post } from "../../services/posts"
import { usePostMedia } from "../../hooks/usePosts"
import { readTime, month } from "../../lib/utils"
import { useUI } from "../ui/Context"
import { Views } from "../ui/Views"
export function SmartImage({
  src,
  alt,
  slug = "",
  className = "",
}: {
  src: string
  alt: string
  slug?: string
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      className={`smart-image ${loaded ? "loaded" : ""} ${className}`}
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        const t = e.currentTarget
        if (!t.dataset.fallback) {
          t.dataset.fallback = "true"
          t.src = `https://picsum.photos/seed/${slug || "wander"}/1200/900`
        }
      }}
    />
  )
}
export function Meta({
  post,
  animateViews = false,
}: {
  post: Post
  animateViews?: boolean
}) {
  return (
    <div className="meta">
      <span>
        <FiCalendar />
        {new Date(post.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
      <span>
        <FiFolder />
        {post.category}
      </span>
      <span>
        <FiClock />
        {readTime(post.content)} min read
      </span>
      <Views count={post.views} animate={animateViews} />
    </div>
  )
}
export function MediaTile({ post }: { post: Post }) {
  const { pathname } = useLocation()
  const { image } = usePostMedia(post)
  const { setModal } = useUI()
  return (
    <div className="media-tile">
      <Link
        to={`/blog/${post.slug}`}
        state={{ fromOwner: /^\/(write|manage)(\/|$)/.test(pathname) }}
        aria-label={`Read ${post.title}`}
      >
        {image ? (
          <SmartImage
            src={image}
            alt={post.media.previewImage?.alt || post.title}
            slug={post.slug}
          />
        ) : (
          <div className="art-tile">
            <span>{post.title[0]}</span>
            <small>A NOTE FROM THE JOURNAL</small>
          </div>
        )}
        <span className="media-arrow">
          <FiArrowUpRight />
        </span>
      </Link>
      {post.media.type !== "image" && (
        <button
          className="play-button"
          aria-label={`Play ${post.title}`}
          onClick={() => setModal(post)}
        >
          <FiPlay fill="currentColor" />
        </button>
      )}
    </div>
  )
}
export function TextTile({
  post,
  variant = 0,
}: {
  post: Post
  variant?: number
}) {
  const { pathname } = useLocation()
  return (
    <Link
      to={`/blog/${post.slug}`}
      state={{ fromOwner: /^\/(write|manage)(\/|$)/.test(pathname) }}
      className={`text-tile variant-${variant}`}
    >
      <span className="tile-category">
        {post.category}
        <span> / </span> NOTES & DISCOVERIES
      </span>
      <h2>{post.title}</h2>
      <Meta post={post} />
      <p>{post.excerpt}</p>
      <span className="read-more">
        Read the story <FiArrowUpRight />
      </span>
    </Link>
  )
}
export function PostUnit({
  post,
  horizontal = false,
  reverse = false,
  variant = 0,
  style,
  trending = false,
}: {
  post: Post
  horizontal?: boolean
  reverse?: boolean
  variant?: number
  style?: React.CSSProperties
  trending?: boolean
}) {
  return (
    <article
      className={`post-unit group ${horizontal ? "horizontal" : "vertical"} ${
        reverse ? "reverse" : ""
      }`}
      style={style}
      data-scroll-label={month(post.createdAt)}
      data-scroll-date={post.createdAt}
    >
      {trending && (
        <span
          className="trending-badge"
          title="One of the three most-viewed stories"
        >
          <FaFire aria-hidden="true" /> Popular
        </span>
      )}
      <MediaTile post={post} />
      <TextTile post={post} variant={variant} />
    </article>
  )
}
export function PostCard({
  post,
  trending = false,
}: {
  post: Post
  trending?: boolean
}) {
  return (
    <article className="post-card">
      {trending && (
        <span
          className="trending-badge"
          title="One of the three most-viewed stories"
        >
          <FaFire aria-hidden="true" /> Popular
        </span>
      )}
      <MediaTile post={post} />
      <TextTile post={post} />
    </article>
  )
}
export function FillerTile({ index = 0 }: { index?: number }) {
  return (
    <Link
      className={`filler filler-${index % 3}`}
      to={index % 3 === 1 ? "/about" : "/blog"}
    >
      {index % 3 === 1 ? (
        <>
          <small>THE PERSON BEHIND THE PAGES</small>
          <h2>A little about me.</h2>
        </>
      ) : index % 3 === 2 ? (
        <>
          <span className="quote-mark">“</span>
          <h2>There is a whole world waiting outside.</h2>
        </>
      ) : (
        <>
          <small>KEEP YOUR CURIOSITY CLOSE</small>
          <h2>
            More places.
            <br />
            More stories.
          </h2>
          <span>
            Explore the journal <FiArrowRight />
          </span>
        </>
      )}
    </Link>
  )
}
