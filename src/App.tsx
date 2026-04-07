import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'sonner'
import { TabBar } from './components/layout/TabBar'
import { Dashboard } from './pages/Dashboard'
import { Feeding } from './pages/Feeding'
import { Sleep } from './pages/Sleep'
import { Diaper } from './pages/Diaper'
import { Growth } from './pages/Growth'
import { Timeline } from './pages/Timeline'
import { Profile } from './pages/Profile'
import { Health } from './pages/Health'
import { Analytics } from './pages/Analytics'
import { Milestones } from './pages/Milestones'
import { TummyTime } from './pages/TummyTime'
import { WeeklyReport } from './pages/WeeklyReport'
import { useThemeStore } from './store/themeStore'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/feeding" element={<Feeding />} />
        <Route path="/sleep" element={<Sleep />} />
        <Route path="/diaper" element={<Diaper />} />
        <Route path="/growth" element={<Growth />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/health" element={<Health />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/milestones" element={<Milestones />} />
        <Route path="/tummy" element={<TummyTime />} />
        <Route path="/weekly" element={<WeeklyReport />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <TabBar />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#1f2937' : 'white',
            border: theme === 'dark' ? '1px solid #374151' : '1px solid #fce7f3',
            borderRadius: '16px',
            fontSize: '14px',
            color: theme === 'dark' ? '#f9fafb' : '#374151',
          },
        }}
      />
    </BrowserRouter>
  )
}
