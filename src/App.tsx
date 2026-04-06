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
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <TabBar />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #fce7f3',
            borderRadius: '16px',
            fontSize: '14px',
            color: '#374151',
          },
        }}
      />
    </BrowserRouter>
  )
}
