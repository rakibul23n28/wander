import { getPostById, incrementPostViews } from "./posts"

// Swap point for a global counter later: POST /api/posts/:id/view.
// Today counts belong only to this browser's IndexedDB, not all readers.
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
    const count = await incrementPostViews(postId)
    sessionStorage.setItem(key, "true")
    return count
  })()
  pending.set(postId, operation)
  try {
    return await operation
  } finally {
    pending.delete(postId)
  }
}
