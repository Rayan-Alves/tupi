import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import ScrollRestorer from './components/ScrollRestorer'

// Eager — needed immediately for auth flow
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Jornada from './pages/Jornada'

// Lazy — loaded on demand per route
const Dashboard   = lazy(() => import('./pages/Dashboard'))
const Spirit      = lazy(() => import('./pages/Spirit'))
const Mind        = lazy(() => import('./pages/Mind'))
const Body        = lazy(() => import('./pages/Body'))
const Profile     = lazy(() => import('./pages/Profile'))
const Projects    = lazy(() => import('./pages/Projects'))
const PadraoMental = lazy(() => import('./pages/PadraoMental'))
const DocList     = lazy(() => import('./pages/DocList'))
const DocEditor   = lazy(() => import('./pages/DocEditor'))
const Library     = lazy(() => import('./pages/Library'))
const BookDetail  = lazy(() => import('./pages/BookDetail'))
const DeepDesires = lazy(() => import('./pages/DeepDesires'))
const UnoPage     = lazy(() => import('./pages/UnoPage'))
const UnoListPage = lazy(() => import('./pages/UnoListPage'))
const Rotinas     = lazy(() => import('./pages/Rotinas'))
const ArvoreVida  = lazy(() => import('./pages/ArvoreVida'))

const PAST = { table: 'past_documents', basePath: '/passado', i18nNs: 'spirit.past', introKey: 'tupi.past.introHidden', introPromptKey: 'spirit.past.prompts.1', pages: 3 }
const PRESENT = { table: 'present_documents', basePath: '/presente', i18nNs: 'spirit.present', introKey: 'tupi.present.introHidden', introPromptKey: 'spirit.present.prompts.1', pages: 1 }
const DESIRES = { table: 'direction_desires', basePath: '/spirit', i18nNs: 'spirit.desires', pages: 3 }

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
      <img src="/tupi-logo.png" alt="TUPI" className="w-48 h-auto animate-pulse" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollRestorer />
        <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/privacy"  element={<PrivacyPolicy />} />
          <Route path="/jornada"       element={<Jornada />} />
          <Route path="/padrao-mental"   element={<ProtectedRoute><PadraoMental /></ProtectedRoute>} />
          <Route path="/padrao-mental-2" element={<ProtectedRoute><PadraoMental table="mental_patterns_2" /></ProtectedRoute>} />
          <Route path="/passado/:id"     element={<ProtectedRoute><DocEditor {...PAST} /></ProtectedRoute>} />
          <Route path="/presente/:id"    element={<ProtectedRoute><DocEditor {...PRESENT} /></ProtectedRoute>} />
          <Route path="/desejos/:id"     element={<ProtectedRoute><DocEditor {...DESIRES} /></ProtectedRoute>} />
          <Route path="/uno/:projectId"  element={<ProtectedRoute><UnoPage /></ProtectedRoute>} />
          <Route path="/arvore/:projectId" element={<ProtectedRoute><ArvoreVida /></ProtectedRoute>} />
          <Route path="/library/:id"     element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/spirit"    element={<Spirit />} />
            <Route path="/mind"      element={<Mind />} />
            <Route path="/body"      element={<Body />} />
            <Route path="/projects"  element={<Projects />} />
            <Route path="/profile"   element={<Profile />} />
            <Route path="/passado"   element={<DocList {...PAST} />} />
            <Route path="/presente"  element={<DocList {...PRESENT} />} />
            <Route path="/uno"               element={<UnoListPage />} />
            <Route path="/rotinas"           element={<Rotinas />} />
            <Route path="/desejos-profundos" element={<DeepDesires />} />
            <Route path="/library"           element={<Library />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
