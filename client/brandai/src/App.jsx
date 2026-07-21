import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ContentStudio from './pages/ContentStudio.jsx'
import WeeklyPlanner from './pages/WeeklyPlanner.jsx'
import BrandBrief from './pages/BrandBrief.jsx'
import Settings from './pages/Settings.jsx'
import Canvas from './pages/Canvas.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/content-studio" element={<ContentStudio />} />
      <Route path="/planner" element={<WeeklyPlanner />} />
      <Route path="/profile-makeover" element={<BrandBrief />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/canvas" element={<Canvas />} />
    </Routes>
  )
}

export default App