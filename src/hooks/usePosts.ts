import { useEffect, useState } from "react"
import { listPosts, type Post } from "../services/posts"
export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    const load = () => {
      setLoading(true)
      listPosts({ limit: 50, sort: "newest" })
        .then((p) => {
          if (active) {
            setPosts(p)
            setLoading(false)
          }
        })
        .catch(() => {
          if (active) setPosts([])
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }
    load()
    window.addEventListener("posts-updated", load)
    return () => {
      active = false
      window.removeEventListener("posts-updated", load)
    }
  }, [])
  return { posts, loading }
}
export function usePostMedia(post: Post) {
  const [media, setMedia] = useState({
    image:
      post.media.previewImage?.url ||
      (post.media.youtubeId
        ? `https://img.youtube.com/vi/${post.media.youtubeId}/hqdefault.jpg`
        : ""),
    video: post.media.video?.url || "",
  })
  useEffect(() => {
    setMedia({
      image:
        post.media.previewImage?.url ||
        (post.media.youtubeId
          ? `https://img.youtube.com/vi/${post.media.youtubeId}/hqdefault.jpg`
          : ""),
      video: post.media.video?.url || "",
    })
  }, [post])
  return media
}
