import { lazy, Suspense, useEffect } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom"
import { UIProvider, useUI } from "./components/ui/Context"
import { Footer, FloatingDock } from "./components/layout/Layout"
import { CustomScrollbar } from "./components/layout/CustomScrollbar"
import { VideoModal } from "./components/ui/VideoModal"
import Home from "./pages/Home"
import Blog from "./pages/Blog"
import Post, { NotFound } from "./pages/Post"
import About from "./pages/About"
import Contact from "./pages/Contact"
const Write = lazy(() => import("./pages/Write"))
const Manage = lazy(() => import("./pages/Manage"))
function Owner({ children }: { children: React.ReactNode }) {
  const { isOwner } = useUI()
  return isOwner ? <>{children}</> : <Navigate to="/" replace />
}
function Content() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    const names: Record<string, string> = {
      "/": "A curious mind. An open road.",
      "/blog": "All stories",
      "/about": "A little about me",
      "/contact": "Say hello",
      "/manage": "Your stories",
      "/write": "A new story begins",
    }
    document.title = `${names[location.pathname] || "The journal"} — wander`
  }, [location.pathname])
  return (
    <>
      <div className="route-content" key={location.pathname}>
        <Suspense
          fallback={<div className="route-loading">Opening a new page…</div>}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<Post />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/write"
              element={
                <Owner>
                  <Write />
                </Owner>
              }
            />
            <Route
              path="/write/:id"
              element={
                <Owner>
                  <Write />
                </Owner>
              }
            />
            <Route
              path="/manage"
              element={
                <Owner>
                  <Manage />
                </Owner>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      <Footer />
      <FloatingDock />
      <CustomScrollbar />
      <VideoModal />
    </>
  )
}
export default function App() {
  return (
    <BrowserRouter>
      <UIProvider>
        <Content />
      </UIProvider>
    </BrowserRouter>
  )
}
