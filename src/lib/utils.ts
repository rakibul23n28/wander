import DOMPurify from "dompurify"
DOMPurify.addHook("uponSanitizeElement", (node) => {
  if (node.nodeName === "IFRAME") {
    const src = (node as Element).getAttribute("src") || ""
    if (
      !/^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[\w-]+(?:\?|$)/.test(
        src,
      )
    )
      node.parentNode?.removeChild(node)
  }
})
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.nodeName === "IFRAME") {
    node.setAttribute("referrerpolicy", "strict-origin-when-cross-origin")
    node.setAttribute("title", node.getAttribute("title") || "Story video")
    node.setAttribute("allowfullscreen", "")
  }
})
export const sanitize = (html: string) =>
  DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allowfullscreen", "allow", "referrerpolicy", "title"],
  })
export const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
export const words = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
export const readTime = (s: string) => Math.max(1, Math.ceil(words(s) / 200))
export const youtubeId = (url: string) => {
  try {
    const u = new URL(url)
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0]
    if (
      [
        "youtube.com",
        "www.youtube.com",
        "www.youtube-nocookie.com",
        "m.youtube.com",
      ].includes(u.hostname)
    )
      return (
        u.searchParams.get("v") ||
        u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1] ||
        ""
      )
  } catch {}
  return ""
}
export function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const month = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "long" })
