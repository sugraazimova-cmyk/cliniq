import * as React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const sidebarVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
}

export const UserProfileSidebar = React.forwardRef(
  ({ user, navItems, logoutItem, className }, ref) => {
    const initials = user.name
      ?.split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?'

    return (
      <motion.aside
        ref={ref}
        className={cn(
          'flex h-full w-full max-w-xs flex-col rounded-xl border border-stone-200 bg-white p-4 text-stone-800 shadow-sm',
          className
        )}
        initial="hidden"
        animate="visible"
        variants={sidebarVariants}
        aria-label="User Profile Menu"
      >
        {/* User Info Header */}
        <motion.div variants={itemVariants} className="flex items-center space-x-4 p-2">
          <div className="h-12 w-12 shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-lg">
            {initials}
          </div>
          <div className="flex flex-col truncate">
            <span className="font-semibold text-lg leading-tight">{user.name}</span>
            <span className="text-sm text-stone-500 truncate">{user.email}</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="my-4 border-t border-stone-200" />

        {/* Navigation */}
        <nav className="flex-1 space-y-1" role="navigation">
          {navItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.isSeparator && <motion.div variants={itemVariants} className="h-4" />}
              <motion.button
                onClick={item.onClick}
                variants={itemVariants}
                className="group flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                <span className="mr-3 h-5 w-5">{item.icon}</span>
                <span>{item.label}</span>
                <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.button>
            </React.Fragment>
          ))}
        </nav>

        {/* Logout */}
        <motion.div variants={itemVariants} className="mt-4">
          <button
            onClick={logoutItem.onClick}
            className="group flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <span className="mr-3 h-5 w-5">{logoutItem.icon}</span>
            <span>{logoutItem.label}</span>
          </button>
        </motion.div>
      </motion.aside>
    )
  }
)

UserProfileSidebar.displayName = 'UserProfileSidebar'
