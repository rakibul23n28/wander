import { useEffect, useState } from "react"
import { listPosts, type Post } from "../services/posts"
export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    const load = () =>
      listPosts().then((p) => {
        if (active) {
          setPosts(p)
          setLoading(false)
        }
      })
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
    const urls: string[] = []
    const object = (blob?: Blob, url?: string) => {
      if (blob) {
        const u = URL.createObjectURL(blob)
        urls.push(u)
        return u
      }
      return url || ""
    }
    setMedia({
      image:
        object(post.media.previewImage?.blob, post.media.previewImage?.url) ||
        (post.media.youtubeId
          ? `https://img.youtube.com/vi/${post.media.youtubeId}/hqdefault.jpg`
          : ""),
      video: object(post.media.video?.blob, post.media.video?.url),
    })
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [post])
  return media
}
