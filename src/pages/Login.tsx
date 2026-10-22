import { FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { PageShell } from "../components/layout/Layout"
import { useUI } from "../components/ui/Context"
import "./Login.css"

export default function Login() {
  const navigate = useNavigate()
  const { login, toast } = useUI()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError("")
    if (!email.trim() || !password) {
      setError("Enter both your email and password.")
      return
    }
    setBusy(true)
    try {
      await login(email.trim(), password)
      toast("Welcome back.")
      navigate("/manage", { replace: true })
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "We could not log you in."
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell
      eyebrow="ACCESS THE JOURNAL"
      title="Log in."
      description="Write, manage, and keep the story archive in your hands."
    >
      <div className="login-grid">
        <section className="login-panel blue-tile">
          <span className="eyebrow">THE WRITER’S DOOR</span>
          <h2>Welcome back.</h2>
          <p>
            Sign in to publish new stories, manage drafts, and keep your work in sync.
          </p>
          <ul className="login-benefits">
            <li><span>01</span> Owner-only writing tools</li>
            <li><span>02</span> Protected post management</li>
            <li><span>03</span> Stories synced with the journal</li>
          </ul>
          <Link to="/" className="login-back-link">
            ← Back to the journal
          </Link>
        </section>

        <section className="login-panel form-panel">
          <div className="login-form-heading">
            <span className="eyebrow">YOUR DESK IS WAITING</span>
            <h2>Sign in to continue.</h2>
            <p>Use your owner account to access the writing studio.</p>
          </div>
          <form onSubmit={submit} noValidate className="login-form">
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
            {error && <p className="error login-error" role="alert">{error}</p>}
            <button className="button login-submit" disabled={busy}>
              {busy ? "Opening your desk…" : "Log in to your account"}
              <span aria-hidden="true">↗</span>
            </button>
            <p className="login-form-footnote">A private space for the stories you’re shaping.</p>
          </form>
        </section>
      </div>
    </PageShell>
  )
}
