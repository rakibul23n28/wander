import { useState } from "react"
import {
  FiArrowUpRight,
  FiCopy,
  FiMapPin,
  FiCheck,
  FiSend,
} from "react-icons/fi"
import { PageShell, Socials } from "../components/layout/Layout"
import { site } from "../config/site"
import { sendMessage } from "../services/contact"
import { useUI } from "../components/ui/Context"
export default function Contact() {
  const { toast } = useUI()
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState("")
  return (
    <PageShell
      eyebrow="A CONVERSATION STARTS HERE"
      title="Say hello."
      description="A story to share? A place I should see? I’d love to hear from you."
    >
      <div className="contact-grid">
        <section className="contact-info blue-tile">
          <span className="eyebrow">MY INBOX IS AN OPEN DOOR</span>
          <h2>Let’s talk.</h2>
          <p>For collaborations, travel tips, or just a friendly hello.</p>
          <div className="email-link">
            <a href={`mailto:${site.email}`}>
              {site.email}
              <FiArrowUpRight />
            </a>
            <button
              aria-label="Copy email address"
              onClick={() => {
                navigator.clipboard?.writeText(site.email)
                toast("Email address copied.")
              }}
            >
              <FiCopy />
            </button>
          </div>
          <div className="contact-location">
            <FiMapPin />
            {site.location}
          </div>
          <p className="reply-note">
            Usually replies within 24 hours.
            <br />A little longer if I’m off the grid.
          </p>
          <Socials />
        </section>
        <section className="contact-form-tile">
          {success ? (
            <div className="contact-success">
              <FiCheck />
              <h2>Thanks, {success}!</h2>
              <p>
                Your message is saved on this device for this demo. For a real
                conversation, send me an email.
              </p>
              <button className="button" onClick={() => setSuccess("")}>
                Write another note
              </button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={async (e) => {
                e.preventDefault()
                const values = Object.fromEntries(
                  new FormData(e.currentTarget),
                ) as Record<string, string>
                if (values.website) return
                const err: Record<string, string> = {}
                if (!values.name.trim()) err.name = "What should I call you?"
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
                  err.email = "Please enter a valid email."
                if (!values.message.trim())
                  err.message = "A little note would be lovely."
                setErrors(err)
                if (Object.keys(err).length) return
                setBusy(true)
                try {
                  await sendMessage(values)
                  setSuccess(values.name.split(" ")[0])
                  setMessage("")
                  toast("Your demo message has been saved locally.")
                } catch {
                  toast("Could not save. Please try again.")
                } finally {
                  setBusy(false)
                }
              }}
            >
              <span className="eyebrow">DROP ME A LINE</span>
              <h2>A note from you.</h2>
              <div className="form-two">
                {[
                  ["name", "Your name", "Alex, for example", "text"],
                  ["email", "Email address", "you@example.com", "email"],
                ].map(([name, label, placeholder, type]) => (
                  <label key={name}>
                    {label}
                    <input
                      name={name}
                      type={type}
                      placeholder={placeholder}
                      aria-invalid={!!errors[name]}
                      required
                    />
                    {errors[name] && (
                      <small className="error">{errors[name]}</small>
                    )}
                  </label>
                ))}
              </div>
              <label>
                Subject <small>(optional)</small>
                <input name="subject" placeholder="What’s on your mind?" />
              </label>
              <label>
                Your message
                <textarea
                  name="message"
                  placeholder="Tell me a little something…"
                  maxLength={500}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  aria-invalid={!!errors.message}
                />
                <span className="field-bottom">
                  <small className="error">{errors.message}</small>
                  <small>{message.length}/500</small>
                </span>
              </label>
              <input
                name="website"
                className="honeypot"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <button className="button" disabled={busy}>
                {busy ? "Saving your note…" : "Send a little hello"}
                <FiSend />
              </button>
              <p className="form-note">
                Frontend demo · Messages stay on this device.
              </p>
            </form>
          )}
        </section>
      </div>
    </PageShell>
  )
}
