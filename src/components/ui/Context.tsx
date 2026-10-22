import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Post } from "../../services/posts"
import { ConfirmDialog } from "./ConfirmDialog"
type UI = {
  isOwner: boolean
  modal: Post | null
  setModal: (p: Post | null) => void
  toast: (s: string) => void
  confirmAction: (s: string) => Promise<boolean>
  overlayOpen: boolean
  setOverlayOpen: (open: boolean) => void
}
const Context = createContext<UI>({
  isOwner: true,
  modal: null,
  setModal: () => {},
  toast: () => {},
  confirmAction: async () => false,
  overlayOpen: false,
  setOverlayOpen: () => {},
})
export const useUI = () => useContext(Context)
export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<Post | null>(null)
  const [message, setMessage] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [overlayOpen, setOverlayOpen] = useState(false)
  const resolve = useRef<((value: boolean) => void) | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  function toast(s: string) {
    clearTimeout(timer.current)
    setMessage(s)
    timer.current = setTimeout(() => setMessage(""), 3500)
  }
  function confirmAction(s: string) {
    setConfirmation(s)
    return new Promise<boolean>((r) => {
      resolve.current = r
    })
  }
  return (
    <Context.Provider
      value={{
        isOwner: true,
        modal,
        setModal,
        toast,
        confirmAction,
        overlayOpen: overlayOpen || !!confirmation,
        setOverlayOpen,
      }}
    >
      {/* Replace this local owner flag with real authentication if a backend is added. */}
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
      {confirmation && (
        <ConfirmDialog
          message={confirmation}
          onClose={(yes) => {
            setConfirmation("")
            resolve.current?.(yes)
            resolve.current = null
          }}
        />
      )}
    </Context.Provider>
  )
}
