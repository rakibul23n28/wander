import { apiFetch } from "../lib/api"
import { sanitize } from "../lib/utils"

export type Post = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  categorySlug?: string
  tags: string[]
  status: "published" | "draft"
  views: number
  featured?: boolean
  isSample?: boolean
  previewImageId?: string
  videoMediaId?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string | null
  media: {
    type: "image" | "video" | "youtube"
    previewImage?: {
      url?: string
      blob?: Blob
      alt?: string
      id?: string
    }
    video?: {
      url?: string
      blob?: Blob
      id?: string
    }
    youtubeUrl?: string
    youtubeId?: string
  }
}

type APIListResponse = {
  items: Post[]
  meta: { total: number; page: number; limit: number; totalPages: number; hasMore: boolean }
}

type PostPayload = Omit<Post, "categorySlug"> & {
  category?: string
  categorySlug?: string
  publishedAt?: string | null
  previewImageId?: string
  previewMediaId?: string
  videoMediaId?: string
  youtubeUrl?: string
  youtubeId?: string
}

function mapPost(record: Partial<PostPayload> & { id?: string }): Post {
  const media: Post["media"] = record.media ?? { type: "image" }
  return {
    id: record.id ?? "",
    slug: record.slug ?? "",
    title: record.title ?? "",
    excerpt: record.excerpt ?? "",
    content: record.content ?? "",
    category: record.category ?? record.categorySlug ?? "General",
    categorySlug: record.categorySlug,
    tags: record.tags ?? [],
    status: record.status === "draft" ? "draft" : "published",
    views: record.views ?? 0,
    featured: !!record.featured,
    isSample: !!record.isSample,
    createdAt: record.createdAt ?? record.publishedAt ?? new Date().toISOString(),
    updatedAt: record.updatedAt ?? record.createdAt ?? new Date().toISOString(),
    publishedAt: record.publishedAt ?? null,
    previewImageId:
      record.previewImageId ?? record.previewMediaId ?? media.previewImage?.id,
    videoMediaId: record.videoMediaId ?? media.video?.id,
    media: {
      type: media.type ?? "image",
      previewImage: media.previewImage
        ? {
            ...media.previewImage,
            id:
              media.previewImage.id ??
              record.previewImageId ??
              record.previewMediaId,
            alt: media.previewImage.alt ?? "",
          }
        : undefined,
      video: media.video
        ? { ...media.video, id: media.video.id ?? record.videoMediaId }
        : undefined,
      youtubeUrl: media.youtubeUrl ?? record.youtubeUrl ?? undefined,
      youtubeId: media.youtubeId ?? record.youtubeId ?? undefined,
    },
  }
}

function normalizeCollection(payload: unknown): Post[] {
  if (Array.isArray(payload)) return payload.map((item) => mapPost(item as PostPayload))
  if (payload && typeof payload === "object") {
    const items = (payload as { items?: unknown[] }).items ?? []
    if (Array.isArray(items)) return items.map((item) => mapPost(item as PostPayload))
  }
  return []
}

export async function listPosts(params: {
  q?: string
  category?: string
  tag?: string
  sort?: string
  page?: number
  limit?: number
} = {}) {
  const payload = await apiFetch<APIListResponse | PostPayload[] | null>("posts", {
    query: {
      q: params.q,
      category: params.category,
      tag: params.tag,
      sort: params.sort,
      page: params.page,
      limit: params.limit ?? 12,
    },
  })
  const items = normalizeCollection(payload)
  return items.sort((a, b) => {
    const aDate = new Date(a.publishedAt || a.createdAt).getTime()
    const bDate = new Date(b.publishedAt || b.createdAt).getTime()
    const order = params.sort === "oldest" ? aDate - bDate : bDate - aDate
    if (params.sort === "views") return (b.views ?? 0) - (a.views ?? 0) || order
    if (params.sort === "az") return a.title.localeCompare(b.title)
    return order
  })
}

export async function getPostById(id: string) {
  const list = await listPosts({ limit: 999 })
  return list.find((post) => post.id === id) || null
}

export async function getAdminPostById(id: string) {
  const payload = await apiFetch<PostPayload>(
    `admin/posts/${encodeURIComponent(id)}`,
  )
  return mapPost(payload)
}

export async function getPostBySlug(slug: string) {
  const record = await apiFetch<PostPayload>(`posts/${encodeURIComponent(slug)}`)
  return mapPost(record)
}

function buildPostPayload(post: Post) {
  const mediaType = post.media.type === "video" ? "video" : post.media.type === "youtube" ? "youtube" : "image"

  return {
    title: post.title.trim(),
    slug: post.slug || "untitled",
    content: sanitize(post.content),
    excerpt: post.excerpt || "",
    category: post.category,
    tags: post.tags ?? [],
    status: post.status === "published" ? "published" : "draft",
    featured: !!post.featured,
    isSample: !!post.isSample,
    publishedAt: post.publishedAt || post.createdAt,
    mediaType,
    previewImageId: post.media.previewImage?.id ?? null,
    previewImageUrl: post.media.previewImage?.url ?? null,
    previewImageAlt: post.media.previewImage?.alt ?? null,
    videoMediaId: post.media.video?.id ?? null,
    videoUrl: post.media.video?.url ?? null,
    youtubeUrl: post.media.youtubeUrl ?? null,
    youtubeId: post.media.youtubeId ?? null,
  }
}

export async function createPost(post: Post) {
  const payload = await apiFetch<PostPayload>("admin/posts", {
    method: "POST",
    body: buildPostPayload(post),
  })
  const next = mapPost(payload)
  window.dispatchEvent(new Event("posts-updated"))
  return next
}

export async function updatePost(id: string, post: Post) {
  const payload = await apiFetch<PostPayload>(`admin/posts/${id}`, {
    method: "PATCH",
    body: buildPostPayload(post),
  })
  const next = mapPost(payload)
  window.dispatchEvent(new Event("posts-updated"))
  return next
}

export async function deletePost(id: string) {
  await apiFetch(`admin/posts/${id}`, { method: "DELETE" })
  window.dispatchEvent(new Event("posts-updated"))
}

export async function incrementPostViews(id: string) {
  const res = await apiFetch<{ views?: number; counted?: boolean }>(`posts/${id}/view`, {
    method: "POST",
  })
  return res.views ?? 0
}

export async function listCategories() {
  const payload = await apiFetch<Array<{ name?: string; slug?: string; id?: string }>>("categories")
  return payload.map((category) => category.name || category.slug || "General")
}

export async function deleteSamplePosts() {
  await apiFetch("admin/posts/samples", { method: "DELETE" })
  window.dispatchEvent(new Event("posts-updated"))
}

export async function getStats() {
  return apiFetch<{ totalViews?: number; publishedPosts?: number; draftPosts?: number }>("admin/stats")
}

export async function checkSlug(slug: string, excludeId?: string) {
  return apiFetch<{ available: boolean; suggestion: string }>("admin/posts/check-slug", {
    query: {
      slug,
      excludeId,
    },
  })
}

export async function saveLocalValue(key: string, value: unknown) {
  localStorage.setItem(`local:${key}`, JSON.stringify(value))
}
