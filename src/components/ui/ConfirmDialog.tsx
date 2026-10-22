import { useEffect, useRef } from "react"
import { FiTrash2 } from "react-icons/fi"
export function ConfirmDialog({
  message,
  onClose,
}: {
  message: string
  onClose: (yes: boolean) => void
}) {
  const cancel = useRef<HTMLButtonElement>(null)
  const confirm = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const old = document.activeElement as HTMLElement
    cancel.current?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false)
      if (e.key === "Tab") {
        e.preventDefault()
        ;(document.activeElement === cancel.current
          ? confirm
          : cancel
        ).current?.focus()
      }
    }
    document.addEventListener("keydown", key)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener("keydown", key)
      old?.focus()
    }
  }, [])
  return (
    <div className="modal-backdrop" onClick={() => onClose(false)}>
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <FiTrash2 />
        <h2 id="confirm-title">One last check.</h2>
        <p id="confirm-message">{message}</p>
        <div>
          <button
            className="button secondary"
            ref={cancel}
            onClick={() => onClose(false)}
          >
            Keep it
          </button>
          <button
            className="button danger"
            ref={confirm}
            onClick={() => onClose(true)}
          >
            Yes, remove
          </button>
        </div>
      </section>
    </div>
  )
}
