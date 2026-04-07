import { NavLink, useLocation } from 'react-router-dom'
import { House, Clock, BarChart3, Baby, HeartPulse, Star } from 'lucide-react'

const tabs = [
  { path: '/', label: 'Главная', Icon: House },
  { path: '/timeline', label: 'История', Icon: Clock },
  { path: '/health', label: 'Здоровье', Icon: HeartPulse },
  { path: '/analytics', label: 'Графики', Icon: BarChart3 },
  { path: '/milestones', label: 'Этапы', Icon: Star },
  { path: '/profile', label: 'Профиль', Icon: Baby },
]

export function TabBar() {
  const location = useLocation()

  function isActive(path: string) {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-pink-100 dark:border-gray-700 z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl min-w-0 relative"
            >
              <div className="flex items-center justify-center">
                <tab.Icon
                  size={22}
                  className={`transition-colors duration-200 ${active ? 'text-pink-500' : 'text-gray-400 dark:text-gray-500'}`}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </div>
              <span className={`text-[10px] font-medium leading-none transition-colors duration-200 ${active ? 'text-pink-500' : 'text-gray-400 dark:text-gray-500'}`}>
                {tab.label}
              </span>
            </NavLink>
          )
        })}

      </div>
    </nav>
  )
}
