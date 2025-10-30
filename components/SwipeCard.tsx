'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SwipeCardProps {
  profile: Profile
  onSwipe: (direction: 'left' | 'right') => void
  style?: any
}

export default function SwipeCard({ profile, onSwipe, style }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      setExitX(info.offset.x > 0 ? 200 : -200)
      onSwipe(info.offset.x > 0 ? 'right' : 'left')
    }
  }

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        ...style,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX * 2 } : {}}
      transition={{ duration: 0.3 }}
      className="absolute w-full max-w-sm cursor-grab active:cursor-grabbing"
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Profile Photo */}
        <div className="h-96 bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-white text-8xl">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {profile.name}
          </h2>

          {profile.school && (
            <p className="text-gray-600 mb-1">🎓 {profile.school}</p>
          )}

          {profile.major && (
            <p className="text-gray-600 mb-3">📚 {profile.major}</p>
          )}

          {profile.subjects && profile.subjects.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Studying:
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.subjects.map((subject, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.bio && (
            <div className="mt-4">
              <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Swipe Indicators */}
      <motion.div
        className="absolute top-8 right-8 bg-red-500 text-white px-6 py-3 rounded-lg font-bold text-2xl rotate-12 border-4 border-red-500"
        style={{ opacity: useTransform(x, [-200, -50], [1, 0]) }}
      >
        NOPE
      </motion.div>
      <motion.div
        className="absolute top-8 left-8 bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-2xl -rotate-12 border-4 border-green-500"
        style={{ opacity: useTransform(x, [50, 200], [0, 1]) }}
      >
        LIKE
      </motion.div>
    </motion.div>
  )
}
