'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

export interface ToastProps {
  show: boolean
  message: string
  icon?: string
  duration?: number
  onClose: () => void
}

export default function Toast({ show, message, icon = '📬', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-3 border-2 border-primary-200">
            <span className="text-2xl">{icon}</span>
            <span className="font-semibold text-gray-800">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
