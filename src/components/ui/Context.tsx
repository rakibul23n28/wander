import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Post } from "../../services/posts"
import { apiFetch, clearAuthToken, getAuthToken, setAuthToken } from "../../lib/api"
import { ConfirmDialog } from "./ConfirmDialog"

type User = {
  id: string
  email: string
  name?: string
  role?: string
}

type UI = {
  user: User | null
  isOwner: boolean
  loadingAuth: boolean
  modal: Post | null
  setModal: (p: Post | null) => void
  toast: (s: string) => void
  confirmAction: (s: string) => Promise<boolean>
  overlayOpen: boolean
  setOverlayOpen: (open: boolean) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}
const Context = createContext<UI>({
  user: null,
  isOwner: false,
  loadingAuth: true,
  modal: null,
  setModal: () => {},
  toast: () => {},
  confirmAction: async () => false,
  overlayOpen: false,
  setOverlayOpen: () => {},
  login: async () => {},
  logout: () => {},
})
export const useUI = () => useContext(Context)
export function UIProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [modal, setModal] = useState<Post | null>(null)
  const [message, setMessage] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [overlayOpen, setOverlayOpen] = useState(false)
  const resolve = useRef<((value: boolean) => void) | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setLoadingAuth(false)
      return
    }

    apiFetch<{ user?: User; email?: string; id?: string; name?: string }>("auth/me")
      .then((payload) => {
        const nextUser = (payload.user || payload) as User
        if (nextUser?.id || nextUser?.email) setUser(nextUser)
        else {
          clearAuthToken()
          setUser(null)
        }
      })
      .catch(() => {
        clearAuthToken()
        setUser(null)
      })
      .finally(() => setLoadingAuth(false))
  }, [])

  async function login(email: string, password: string) {
    const response = await apiFetch<{ token: string; user: User }>("auth/login", {
      method: "POST",
      body: { email, password },
    })
    setAuthToken(response.token)
    setUser(response.user)
  }

  function logout() {
    clearAuthToken()
    setUser(null)
  }

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
        user,
        isOwner: !!user,
        loadingAuth,
        modal,
        setModal,
        toast,
        confirmAction,
        overlayOpen: overlayOpen || !!confirmation,
        setOverlayOpen,
        login,
        logout,
      }}
    >
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
