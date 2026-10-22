import { apiFetch } from "../lib/api"
import { getPostById } from "./posts"

const pending = new Map<string, Promise<number>>()

export async function getViews(postId: string): Promise<number> {
  return (await getPostById(postId))?.views ?? 0
}

export async function incrementView(postId: string): Promise<number> {
  const inFlight = pending.get(postId)
  if (inFlight) return inFlight
  const operation = (async () => {
    const key = `viewed:${postId}`
    if (sessionStorage.getItem(key)) return getViews(postId)
    const post = await getPostById(postId)
    if (!post || post.status !== "published") return post?.views ?? 0
    const response = await apiFetch<{ views?: number }>(`posts/${postId}/view`, {
      method: "POST",
    })
    sessionStorage.setItem(key, "true")
    return response.views ?? post.views
  })()
  pending.set(postId, operation)
  try {
    return await operation
  } finally {
    pending.delete(postId)
  }
}
