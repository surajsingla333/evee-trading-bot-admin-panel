import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { useSidebar } from '@/hooks/useSidebar'
import { pageTransition } from '@/lib/motion'
import { cn } from '@/lib/cn'

export function DashboardLayout() {
  const { collapsed } = useSidebar()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0B1220] page-bg">
      <Sidebar />
      <div
        className={cn(
          'min-h-screen transition-[padding] duration-280 ease-out',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]',
        )}
      >
        <TopNav />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-[1440px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
