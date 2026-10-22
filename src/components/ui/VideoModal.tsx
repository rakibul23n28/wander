import { useEffect, useRef } from "react"
import { FiX } from "react-icons/fi"
import { useUI } from "./Context"
import { usePostMedia } from "../../hooks/usePosts"
import type { Post } from "../../services/posts"
export function YouTubeEmbed({ id }: { id: string }) {
  return (
    <iframe
      className="youtube-embed"
      src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`}
      referrerPolicy="strict-origin-when-cross-origin"
      title="YouTube video player"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  )
}
function Player({ post }: { post: Post }) {
  const m = usePostMedia(post)
  return post.media.type === "youtube" ? (
    <YouTubeEmbed id={post.media.youtubeId || ""} />
  ) : (
    <video src={m.video} poster={m.image} controls autoPlay playsInline />
  )
}
export function VideoModal() {
  const { modal, setModal } = useUI()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!modal) return
    const old = document.activeElement as HTMLElement
    document.body.style.overflow = "hidden"
    ref.current?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null)
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          "button,iframe,video",
        )
        if (!nodes?.length) return
        const first = nodes[0],
          last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", key)
    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("keydown", key)
      old?.focus()
    }
  }, [modal])
  if (!modal) return null
  return (
    <div className="modal-backdrop" onClick={() => setModal(null)}>
      <div
        className="video-modal"
        role="dialog"
        aria-modal="true"
        aria-label={modal.title}
        ref={ref}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={() => setModal(null)}
          aria-label="Close video"
        >
          <FiX />
        </button>
        <Player post={modal} />
        <h3>{modal.title}</h3>
      </div>
    </div>
  )
}
