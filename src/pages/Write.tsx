import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Youtube from "@tiptap/extension-youtube"
import Placeholder from "@tiptap/extension-placeholder"
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiLink,
  FiImage,
  FiYoutube,
  FiMinus,
  FiRotateCcw,
  FiRotateCw,
  FiUploadCloud,
  FiX,
  FiEye,
  FiArrowUpRight,
} from "react-icons/fi"
import { PageShell } from "../components/layout/Layout"
import { PostUnit } from "../components/tiles/Tiles"
import { PostView } from "./Post"
import { useUI } from "../components/ui/Context"
import {
  getPostById,
  createPost,
  deletePost,
  type Post,
} from "../services/posts"
import { usePosts } from "../hooks/usePosts"
import { slugify, words, readTime, youtubeId } from "../lib/utils"
import { Views } from "../components/ui/Views"
const emptyPost = (): Post => ({
  id: crypto.randomUUID(),
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  category: "Travel",
  tags: [],
  status: "draft",
  views: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  media: { type: "image" },
})
async function compress(file: File) {
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width * ratio
  canvas.height = bitmap.height * ratio
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("Image could not be processed.")),
      "image/webp",
      0.84,
    ),
  )
}
export default function Write() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast, confirmAction, setOverlayOpen } = useUI()
  const { posts } = usePosts()
  const [post, setPost] = useState<Post>(emptyPost)
  const [dirty, setDirty] = useState(false)
  const [preview, setPreview] = useState(false)
  const [tag, setTag] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [slugEdited, setSlugEdited] = useState(false)
  const imageInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [videoPreview, setVideoPreview] = useState("")
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Youtube.configure({ nocookie: true }),
      Placeholder.configure({ placeholder: "Tell your story…" }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setPost((p) => ({ ...p, content: editor.getHTML() }))
      setDirty(true)
    },
    editorProps: { attributes: { class: "post-prose editor-prose" } },
  })
  useEffect(() => {
    if (id)
      getPostById(id).then((p) => {
        if (p) {
          setPost(p)
          editor?.commands.setContent(p.content)
          setSlugEdited(true)
        } else {
          toast("That story was not found.")
          navigate("/manage")
        }
      })
    else {
      const p = emptyPost()
      setPost(p)
      editor?.commands.setContent("")
      setSlugEdited(false)
    }
    setDirty(false)
  }, [id, editor])
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    addEventListener("beforeunload", fn)
    return () => removeEventListener("beforeunload", fn)
  }, [dirty])
  useEffect(() => {
    setOverlayOpen(preview)
    return () => setOverlayOpen(false)
  }, [preview])
  useEffect(() => {
    if (!preview) return
    document.body.style.overflow = "hidden"
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(false)
    }
    addEventListener("keydown", key)
    return () => {
      document.body.style.overflow = ""
      removeEventListener("keydown", key)
    }
  }, [preview])
  useEffect(() => {
    const blob = post.media.previewImage?.blob
    const url = blob
      ? URL.createObjectURL(blob)
      : post.media.previewImage?.url || ""
    setImagePreview(url)
    return () => {
      if (blob) URL.revokeObjectURL(url)
    }
  }, [post.media.previewImage])
  useEffect(() => {
    const blob = post.media.video?.blob
    const url = blob ? URL.createObjectURL(blob) : post.media.video?.url || ""
    setVideoPreview(url)
    return () => {
      if (blob) URL.revokeObjectURL(url)
    }
  }, [post.media.video])
  function change(p: Partial<Post>) {
    setPost((old) => ({ ...old, ...p }))
    setDirty(true)
  }
  function media(p: Partial<Post["media"]>) {
    change({ media: { ...post.media, ...p } })
  }
  async function uploadImage(file?: File) {
    if (!file) return
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP image under 8 MB.")
      return
    }
    try {
      media({ previewImage: { blob: await compress(file), alt: post.title } })
      setError("")
    } catch {
      setError("Could not read this image.")
    }
  }
  async function uploadVideo(file?: File) {
    if (!file) return
    if (
      !["video/mp4", "video/webm"].includes(file.type) ||
      file.size > 100 * 1024 * 1024
    ) {
      setError("Choose an MP4 or WebM video under 100 MB.")
      return
    }
    setProgress(25)
    await new Promise((r) => setTimeout(r, 100))
    media({ video: { blob: file } })
    setProgress(100)
    setTimeout(() => setProgress(0), 700)
  }
  function addTag() {
    const value = tag.trim().replace(/,$/, "")
    if (value && !post.tags.includes(value))
      change({ tags: [...post.tags, value] })
    setTag("")
  }
  async function save(status: "draft" | "published") {
    if (!post.title.trim()) {
      setError("Give your story a title.")
      return
    }
    if (
      status === "published" &&
      (!/<p[^>]*>[^]*?\S[^]*?<\/p>/.test(post.content) ||
        words(post.content) < 2)
    ) {
      setError("Add at least one paragraph before publishing.")
      return
    }
    if (post.media.type === "youtube" && !post.media.youtubeId) {
      setError("Enter a valid YouTube video URL.")
      return
    }
    setBusy(true)
    try {
      const p = {
        ...post,
        status,
        slug: slugify(post.slug || post.title),
        excerpt:
          post.excerpt ||
          (
            new DOMParser()
              .parseFromString(post.content, "text/html")
              .querySelector("p")?.textContent || ""
          ).slice(0, 160),
        updatedAt: new Date().toISOString(),
      }
      await createPost(p)
      setPost(p)
      setDirty(false)
      setError("")
      toast(
        status === "published"
          ? "Your story is out in the world."
          : "Draft saved. Take your time.",
      )
      if (!id) navigate(`/write/${p.id}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setBusy(false)
    }
  }
  const tools = [
    [
      "Heading 2",
      () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      "H2",
    ],
    [
      "Heading 3",
      () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      "H3",
    ],
    ["Bold", () => editor?.chain().focus().toggleBold().run(), <FiBold />],
    [
      "Italic",
      () => editor?.chain().focus().toggleItalic().run(),
      <FiItalic />,
    ],
    [
      "Underline",
      () => editor?.chain().focus().toggleUnderline().run(),
      <FiUnderline />,
    ],
    ["Strike", () => editor?.chain().focus().toggleStrike().run(), <s>S</s>],
    [
      "Bullet list",
      () => editor?.chain().focus().toggleBulletList().run(),
      <FiList />,
    ],
    [
      "Numbered list",
      () => editor?.chain().focus().toggleOrderedList().run(),
      "1.",
    ],
    ["Blockquote", () => editor?.chain().focus().toggleBlockquote().run(), "“"],
    [
      "Code block",
      () => editor?.chain().focus().toggleCodeBlock().run(),
      "</>",
    ],
    [
      "Link",
      () => {
        const url = prompt("Link URL (https://…)")
        if (url && /^https?:\/\//.test(url))
          editor
            ?.chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run()
      },
      <FiLink />,
    ],
    [
      "Inline image",
      () => {
        const url = prompt("Image URL (https://…), or cancel to upload")
        if (url && /^https:\/\//.test(url))
          editor
            ?.chain()
            .focus()
            .setImage({ src: url, alt: "Story photograph" })
            .run()
        else if (url === null) {
          const input = document.createElement("input")
          input.type = "file"
          input.accept = "image/jpeg,image/png,image/webp"
          input.onchange = async () => {
            const f = input.files?.[0]
            if (f && f.size < 8 * 1024 * 1024) {
              const blob = await compress(f)
              const reader = new FileReader()
              reader.onload = () =>
                editor
                  ?.chain()
                  .focus()
                  .setImage({ src: String(reader.result) })
                  .run()
              reader.readAsDataURL(blob)
            }
          }
          input.click()
        }
      },
      <FiImage />,
    ],
    [
      "YouTube embed",
      () => {
        const url = prompt("Paste a YouTube URL")
        const id = url ? youtubeId(url) : ""
        if (id)
          editor?.commands.setYoutubeVideo({
            src: `https://www.youtube-nocookie.com/embed/${id}`,
          })
      },
      <FiYoutube />,
    ],
    [
      "Divider",
      () => editor?.chain().focus().setHorizontalRule().run(),
      <FiMinus />,
    ],
    ["Undo", () => editor?.chain().focus().undo().run(), <FiRotateCcw />],
    ["Redo", () => editor?.chain().focus().redo().run(), <FiRotateCw />],
  ] as const
  return (
    <PageShell
      eyebrow="YOUR LITTLE WRITING CORNER"
      title={id ? "Shape your story." : "A new story begins."}
      description="A blank page. A little curiosity. Something worth sharing."
    >
      <div className="editor-layout">
        <section className="editor-main">
          <input
            className="title-input"
            aria-label="Post title"
            placeholder="Give your story a title…"
            value={post.title}
            onChange={(e) => {
              change({
                title: e.target.value,
                ...(!slugEdited ? { slug: slugify(e.target.value) } : {}),
              })
            }}
          />
          <label className="slug-label">
            wander / blog /{" "}
            <input
              aria-label="Post slug"
              value={post.slug}
              placeholder="your-story"
              onChange={(e) => {
                setSlugEdited(true)
                change({ slug: slugify(e.target.value) })
              }}
            />
          </label>
          <div className="editor-toolbar">
            {tools.map(([label, action, icon]) => (
              <button
                type="button"
                key={label}
                aria-label={label}
                title={label}
                onClick={action}
              >
                {icon}
              </button>
            ))}
          </div>
          <EditorContent editor={editor} />
          <div className="editor-count">
            <span>
              {words(post.content)} words · {readTime(post.content)} min read
            </span>
            <span>
              {dirty ? "Unsaved changes" : "All changes saved locally"}
            </span>
          </div>
        </section>
        <aside className="editor-sidebar">
          <section className="editor-card">
            <div className="card-heading">
              <h3>Make it a story.</h3>
              <span className="status-chip">{post.status}</span>
            </div>
            <div className="editor-views">
              <span>Story views</span>
              <Views
                count={posts.find((p) => p.id === post.id)?.views ?? post.views}
              />
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button"
              disabled={busy}
              onClick={() => save("published")}
            >
              {busy
                ? "Saving…"
                : post.status === "published"
                  ? "Update story"
                  : "Publish story"}
              <FiArrowUpRight />
            </button>
            <div className="editor-actions">
              <button onClick={() => save("draft")} disabled={busy}>
                Save draft
              </button>
              <button onClick={() => setPreview(true)}>
                <FiEye /> Preview
              </button>
            </div>
            {id && (
              <button
                className="delete-link"
                onClick={async () => {
                  if (await confirmAction("Delete this story permanently?")) {
                    await deletePost(id)
                    setDirty(false)
                    toast("Story deleted.")
                    navigate("/manage")
                  }
                }}
              >
                Delete story
              </button>
            )}
          </section>
          <section className="editor-card">
            <h3>The details.</h3>
            <label>
              Category
              <select
                value={post.category}
                onChange={(e) => {
                  if (e.target.value === "__new") {
                    const c = prompt("New category name")
                    if (c?.trim()) change({ category: c.trim() })
                  } else change({ category: e.target.value })
                }}
              >
                {[
                  ...new Set([
                    "Travel",
                    "Adventure",
                    "Lifestyle",
                    "Life & thoughts",
                    post.category,
                    ...posts.map((p) => p.category),
                  ]),
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
                <option value="__new">+ Add category</option>
              </select>
            </label>
            <label>
              Tags
              <div className="tag-input">
                {post.tags.map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      change({ tags: post.tags.filter((v) => v !== t) })
                    }
                  >
                    {t}
                    <FiX />
                  </button>
                ))}
                <input
                  value={tag}
                  placeholder="Type a tag, press enter"
                  onChange={(e) => setTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addTag()
                    }
                    if (e.key === "Backspace" && !tag)
                      change({ tags: post.tags.slice(0, -1) })
                  }}
                />
              </div>
            </label>
            <label>
              A short introduction
              <textarea
                maxLength={160}
                rows={3}
                value={post.excerpt}
                placeholder="Leave blank to use your opening paragraph…"
                onChange={(e) => change({ excerpt: e.target.value })}
              />
              <small>{post.excerpt.length}/160</small>
            </label>
          </section>
          <section className="editor-card">
            <h3>First impressions.</h3>
            <p>Your preview image appears on story tiles.</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              ref={imageInput}
              onChange={(e) => uploadImage(e.target.files?.[0])}
            />
            <button
              className="upload-zone"
              onClick={() => imageInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                uploadImage(e.dataTransfer.files[0])
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" />
              ) : (
                <>
                  <FiUploadCloud />
                  <span>Drop an image or click to upload</span>
                  <small>JPG, PNG, WebP · up to 8 MB</small>
                </>
              )}
            </button>
            {imagePreview && (
              <button
                className="delete-link"
                onClick={() => media({ previewImage: undefined })}
              >
                Remove image
              </button>
            )}
            <input
              aria-label="Preview image URL"
              placeholder="Or paste an image URL"
              value={post.media.previewImage?.url || ""}
              onChange={(e) =>
                media({
                  previewImage: {
                    url: e.target.value,
                    alt: post.media.previewImage?.alt,
                  },
                })
              }
            />
            <input
              aria-label="Image alt text"
              placeholder="Describe the image (alt text)"
              value={post.media.previewImage?.alt || ""}
              onChange={(e) =>
                media({
                  previewImage: {
                    ...post.media.previewImage,
                    alt: e.target.value,
                  },
                })
              }
            />
          </section>
          <section className="editor-card">
            <h3>Bring it to life.</h3>
            <div className="segmented">
              {(["image", "video", "youtube"] as const).map((t) => (
                <button
                  key={t}
                  className={post.media.type === t ? "selected" : ""}
                  onClick={() => media({ type: t })}
                >
                  {t === "video"
                    ? "Video"
                    : t === "youtube"
                      ? "YouTube"
                      : "Image"}
                </button>
              ))}
            </div>
            {post.media.type === "video" && (
              <>
                <input
                  type="file"
                  hidden
                  ref={videoInput}
                  accept="video/mp4,video/webm"
                  onChange={(e) => uploadVideo(e.target.files?.[0])}
                />
                <button
                  className="upload-zone"
                  onClick={() => videoInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    uploadVideo(e.dataTransfer.files[0])
                  }}
                >
                  <FiUploadCloud />
                  <span>Upload MP4 or WebM</span>
                  <small>Up to 100 MB · stored on your device</small>
                </button>
                {progress > 0 && <progress value={progress} max={100} />}
                <input
                  placeholder="Or paste a public video URL"
                  value={post.media.video?.url || ""}
                  onChange={(e) => media({ video: { url: e.target.value } })}
                />
                {videoPreview && (
                  <video controls src={videoPreview} poster={imagePreview} />
                )}
              </>
            )}
            {post.media.type === "youtube" && (
              <>
                <input
                  placeholder="Paste a YouTube link…"
                  value={post.media.youtubeUrl || ""}
                  onChange={(e) =>
                    media({
                      youtubeUrl: e.target.value,
                      youtubeId: youtubeId(e.target.value),
                    })
                  }
                />
                {post.media.youtubeUrl && !post.media.youtubeId && (
                  <p className="error">Please enter a valid YouTube URL.</p>
                )}
                {post.media.youtubeId && (
                  <iframe
                    className="youtube-embed"
                    src={`https://www.youtube-nocookie.com/embed/${post.media.youtubeId}`}
                    title="YouTube preview"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                )}
              </>
            )}
          </section>
          <section className="editor-card tile-preview">
            <h3>A little preview.</h3>
            <PostUnit
              post={{
                ...post,
                title: post.title || "Your story starts here",
                excerpt: post.excerpt || "A few words to make someone curious.",
              }}
            />
          </section>
        </aside>
      </div>
      {preview && (
        <div
          className="post-preview"
          role="dialog"
          aria-modal="true"
          aria-label="Story preview"
        >
          <div className="preview-bar">
            <span>STORY PREVIEW · NOT YET SAVED</span>
            <button
              className="button"
              autoFocus
              onClick={() => setPreview(false)}
            >
              Back to writing <FiX />
            </button>
          </div>
          <PostView post={post} preview />
        </div>
      )}
    </PageShell>
  )
}
