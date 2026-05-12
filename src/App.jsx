import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Spirit from './pages/Spirit'
import Mind from './pages/Mind'
import Body from './pages/Body'
import Profile from './pages/Profile'
import Projects from './pages/Projects'
import Jornada from './pages/Jornada'
import PadraoMental from './pages/PadraoMental'
import Passado from './pages/Passado'
import PassadoDoc from './pages/PassadoDoc'

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
        <Routes>
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/jornada"       element={<Jornada />} />
          <Route path="/padrao-mental"   element={<ProtectedRoute><PadraoMental /></ProtectedRoute>} />
          <Route path="/padrao-mental-2" element={<ProtectedRoute><PadraoMental table="mental_patterns_2" /></ProtectedRoute>} />
          <Route path="/passado/:id"     element={<ProtectedRoute><PassadoDoc /></ProtectedRoute>} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/spirit"    element={<Spirit />} />
            <Route path="/mind"      element={<Mind />} />
            <Route path="/body"      element={<Body />} />
            <Route path="/projects"  element={<Projects />} />
            <Route path="/profile"   element={<Profile />} />
            <Route path="/passado"   element={<Passado />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
