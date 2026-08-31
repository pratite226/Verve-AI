import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ContentStudio from './pages/ContentStudio.jsx'
import WeeklyPlanner from './pages/WeeklyPlanner.jsx'
import BrandBrief from './pages/BrandBrief.jsx'
import Settings from './pages/Settings.jsx'
import Canvas from './pages/Canvas.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/content-studio" element={<ProtectedRoute><ContentStudio /></ProtectedRoute>} />
      <Route path="/planner" element={<ProtectedRoute><WeeklyPlanner /></ProtectedRoute>} />
      <Route path="/profile-makeover" element={<ProtectedRoute><BrandBrief /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/canvas" element={<ProtectedRoute><Canvas /></ProtectedRoute>} />
    </Routes>
  )
}

export default App