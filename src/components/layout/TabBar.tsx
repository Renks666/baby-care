import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { House, Clock, BarChart3, Baby, HeartPulse } from 'lucide-react'

const tabs = [
  { path: '/', label: 'Главная', Icon: House },
  { path: '/timeline', label: 'История', Icon: Clock },
  { path: '/health', label: 'Здоровье', Icon: HeartPulse },
  { path: '/analytics', label: 'Графики', Icon: BarChart3 },
  { path: '/profile', label: 'Профиль', Icon: Baby },
]

export function TabBar() {
  const location = useLocation()

  function isActive(path: string) {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur-md border-t border-pink-100 z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl min-w-0 relative"
            >
              <div className="relative flex items-center justify-center">
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 -m-1.5 rounded-xl bg-pink-50"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.Icon
                  size={22}
                  className={`relative z-10 transition-colors duration-200 ${active ? 'text-pink-500' : 'text-gray-400'}`}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </div>
              <span className={`text-[10px] font-medium leading-none transition-colors duration-200 ${active ? 'text-pink-500' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
