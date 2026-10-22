import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import {
  FiHome,
  FiBookOpen,
  FiUser,
  FiMail,
  FiShuffle,
  FiArrowUpRight,
  FiSend,
  FiMenu,
  FiX,
} from "react-icons/fi"
import { FaFacebookF, FaInstagram } from "react-icons/fa"
import { site } from "../../config/site"
import { useUI } from "../ui/Context"
import { saveLocalValue } from "../../services/posts"
const links = [
  ["/", "Home", FiHome],
  ["/blog", "Blog", FiBookOpen],
  ["/about", "About", FiUser],
  ["/contact", "Contact", FiMail],
] as const
export function Profile() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { isOwner, user, logout } = useUI()
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", key)
    }
  }, [])
  return (
    <div className="profile" ref={ref}>
      <button
        className="avatar-button"
        aria-label="Open profile menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <img src={site.avatar} alt={site.authorName} />
      </button>
      {open && (
        <div className="profile-menu">
          {isOwner ? (
            <>
              {[
                ["/write", "Write new post"],
                ["/manage", "Manage posts"],
                ["/about", "About me"],
              ].map(([url, label]) => (
                <Link to={url} key={url} onClick={() => setOpen(false)}>
                  {label}
                  <FiArrowUpRight />
                </Link>
              ))}
              <button
                className="logout-link"
                onClick={() => {
                  logout()
                  setOpen(false)
                }}
              >
                Log out
                <FiArrowUpRight />
              </button>
            </>
          ) : (
            <>
              <Link to="/about" onClick={() => setOpen(false)}>
                About me
                <FiArrowUpRight />
              </Link>
              <Link to="/login" onClick={() => setOpen(false)}>
                Log in
                <FiArrowUpRight />
              </Link>
            </>
          )}
          {user && <small className="username">{user.email}</small>}
        </div>
      )}
    </div>
  )
}
export function Socials() {
  return (
    <div className="socials">
      <a
        href={site.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
      >
        <FaFacebookF />
      </a>
      <a
        href={site.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
      >
        <FaInstagram />
      </a>
    </div>
  )
}
export function NavBlock({ shuffle }: { shuffle?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <nav
      id="nav-block"
      className={`nav-block ${open ? "expanded" : ""}`}
      style={{
        backgroundImage: `var(--nav-overlay),url(${site.navBackground})`,
      }}
      aria-label="Main navigation"
    >
      <div className="nav-top">
        <Link to="/" className="wordmark">
          {site.brandName}
          <span>.</span>
        </Link>
        <button
          className="mobile-menu"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? <FiX /> : <FiMenu />} Menu
        </button>
        {shuffle && (
          <button
            className="shuffle"
            onClick={shuffle}
            title="Shuffle the stories"
            aria-label="Shuffle the stories"
          >
            <FiShuffle />
          </button>
        )}
      </div>
      <div className="nav-content">
        <p className="nav-tagline">A JOURNAL OF PLACES & LITTLE THINGS</p>
        <div className="nav-links">
          {links.map(([url, label]) => (
            <NavLink end={url === "/"} to={url} key={url}>
              {label}
              <FiArrowUpRight />
            </NavLink>
          ))}
        </div>
        <div className="nav-bottom">
          <Socials />
          <span className="nav-author">
            A little space by {site.authorName.split(" ")[0]}
          </span>
          <Profile />
        </div>
      </div>
    </nav>
  )
}
export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="page-shell">
      <div className="page-top">
        <NavBlock />
        <header className="page-header">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <div className="header-description">{description}</div>
          <span className="header-star">✳</span>
        </header>
      </div>
      {children}
    </main>
  )
}
export function FloatingDock() {
  const [visible, setVisible] = useState(false)
  const { pathname } = useLocation()
  const { modal, overlayOpen } = useUI()
  useEffect(() => {
    const node = document.getElementById("nav-block")
    if (!node) return
    const ob = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting))
    ob.observe(node)
    return () => ob.disconnect()
  }, [pathname])
  return (
    <div
      className={`floating-dock ${
        visible && !modal && !overlayOpen ? "show" : ""
      }`}
    >
      <Link to="/" className="dock-mark">
        w.
      </Link>
      {links.map(([url, label, Icon]) => (
        <NavLink end={url === "/"} to={url} key={url} aria-label={label}>
          <Icon />
        </NavLink>
      ))}
      <Profile />
    </div>
  )
}
export function Footer() {
  const { toast } = useUI()
  return (
    <footer className="footer">
      <div>
        <Link to="/" className="wordmark">
          {site.brandName}.
        </Link>
        <p>
          Good stories. A little wanderlust.
          <br />A note from me, every now and then.
        </p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const f = e.currentTarget
          const data = new FormData(f)
          const email = String(data.get("email") || "")
          const website = String(data.get("website") || "")
          if (website) return
          try {
            await fetch(`${(import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "")}/subscribers`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            }).then(async (res) => {
              const payload = await res.json().catch(() => null)
              if (!res.ok) throw new Error(payload?.message || "Could not subscribe.")
            })
            toast("You’re on the list. Stay curious!")
            f.reset()
          } catch (error) {
            toast(error instanceof Error ? error.message : "Could not subscribe.")
          }
        }}
      >
        <label htmlFor="newsletter">Letters from the road.</label>
        <div className="newsletter">
          <input
            id="newsletter"
            name="email"
            type="email"
            placeholder="Your email address"
            required
          />
          <input name="website" className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <button aria-label="Subscribe to newsletter">
            <FiSend />
          </button>
        </div>
        <small>No noise. Just the good things.</small>
      </form>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {site.authorName}. All rights reserved.
        </span>
        <span>Made for the moments in between.</span>
        <Socials />
      </div>
    </footer>
  )
}
