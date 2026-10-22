import { get, set, del, entries, update } from "idb-keyval"
import { sanitize } from "../lib/utils"
import { seedPosts } from "../data/seed"
export type Post = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  status: "published" | "draft"
  views: number
  featured?: boolean
  isSample?: boolean
  createdAt: string
  updatedAt: string
  media: {
    type: "image" | "video" | "youtube"
    previewImage?: {
      url?: string
      blob?: Blob
      alt?: string
    }
    video?: {
      url?: string
      blob?: Blob
    }
    youtubeUrl?: string
    youtubeId?: string
  }
}
// Local storage boundary: replace these functions with REST calls when a backend is needed.
let init: Promise<void> | null = null
function initialize() {
  return (init ??= (async () => {
    if (!(await get("wander:seeded"))) {
      for (const p of seedPosts) await set(`post:${p.id}`, p)
      await set("wander:seeded", true)
    }
    // Upgrade existing local records without resetting edited stories or counts.
    for (const [key, value] of await entries()) {
      if (String(key).startsWith("post:") && value.views == null) {
        const sample =
          value.isSample && seedPosts.find((p) => p.id === value.id)
        await set(key, { ...value, views: sample ? sample.views : 0 })
      }
    }
  })())
}
export async function listPosts() {
  await initialize()
  return (await entries())
    .filter(([k]) => String(k).startsWith("post:"))
    .map(([, v]) => v as Post)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
export async function getPostById(id: string) {
  await initialize()
  return get<Post>(`post:${id}`)
}
export async function getPostBySlug(slug: string) {
  return (await listPosts()).find((p) => p.slug === slug)
}
export async function createPost(post: Post) {
  const all = await listPosts()
  if (all.some((p) => p.slug === post.slug && p.id !== post.id))
    throw new Error("This slug is already in use.")
  const existing = all.find((p) => p.id === post.id)
  const p = {
    ...post,
    views: existing?.views ?? post.views ?? 0,
    content: sanitize(post.content),
  }
  await set(`post:${p.id}`, p)
  window.dispatchEvent(new Event("posts-updated"))
  return p
}
export async function updatePost(id: string, post: Post) {
  return createPost({ ...post, id, updatedAt: new Date().toISOString() })
}
export async function deletePost(id: string) {
  await del(`post:${id}`)
  window.dispatchEvent(new Event("posts-updated"))
}
// Atomic counter-only write: does not change the story's editorial updatedAt.
export async function incrementPostViews(id: string) {
  await initialize()
  let count = 0
  await update<Post>(`post:${id}`, (post) => {
    if (!post) throw new Error("Story not found.")
    count = post.views ?? 0
    if (post.status !== "published") return post
    count++
    return { ...post, views: count }
  })
  window.dispatchEvent(new Event("posts-updated"))
  return count
}
export async function listCategories() {
  return [...new Set((await listPosts()).map((p) => p.category))]
}
export async function saveLocalValue(key: string, value: unknown) {
  await set(`local:${key}`, value)
}
