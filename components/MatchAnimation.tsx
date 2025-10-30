'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface MatchAnimationProps {
  show: boolean
  currentUserProfile: Profile | null
  matchedProfile: Profile | null
  onClose: () => void
}

export default function MatchAnimation({
  show,
  currentUserProfile,
  matchedProfile,
  onClose
}: MatchAnimationProps) {
  console.log('MatchAnimation render:', { show, hasCurrentUser: !!currentUserProfile, hasMatchedProfile: !!matchedProfile })

  return (
    <AnimatePresence>
      {show && matchedProfile && currentUserProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          }}
          onClick={onClose}
        >
          {/* Confetti Effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(50)].map((_, i) => {
              const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4d96ff', '#ff85de']
              const randomColor = colors[Math.floor(Math.random() * colors.length)]
              const randomX = Math.random() * 100
              const randomDelay = Math.random() * 0.5
              const randomDuration = 3 + Math.random() * 2

              return (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    y: -20,
                    x: `${randomX}%`,
                    rotate: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    y: ['0vh', '120vh'],
                    rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  }}
                  transition={{
                    duration: randomDuration,
                    delay: randomDelay,
                    ease: 'easeIn',
                  }}
                  className="absolute w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: randomColor,
                  }}
                />
              )
            })}
          </div>

          {/* Radial burst */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-96 h-96 rounded-full bg-white" />
          </motion.div>

          <div className="relative max-w-4xl w-full">
            {/* "It's a Match!" text with glow effect */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{
                scale: [0, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 0.6,
                times: [0, 0.6, 1],
                delay: 0.3,
              }}
              className="mb-8"
            >
              <motion.h1
                animate={{
                  textShadow: [
                    '0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 107, 107, 0.5)',
                    '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 107, 107, 0.8)',
                    '0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 107, 107, 0.5)',
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-6xl md:text-8xl font-black text-white text-center"
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '0.05em',
                }}
              >
                IT&apos;S A MATCH!
              </motion.h1>
            </motion.div>

            {/* Profile cards */}
            <div className="flex justify-center items-center gap-4 md:gap-8 mb-8">
              {/* Current user card */}
              <motion.div
                initial={{ x: -200, rotate: -20, opacity: 0 }}
                animate={{ x: 0, rotate: -5, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                  delay: 0.4,
                }}
                className="relative"
              >
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white text-4xl md:text-6xl font-bold shadow-2xl border-4 border-white overflow-hidden">
                  {currentUserProfile.photo_url ? (
                    <img
                      src={currentUserProfile.photo_url}
                      alt={currentUserProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUserProfile.name.charAt(0).toUpperCase()
                  )}
                </div>
              </motion.div>

              {/* Heart icon with burst */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{
                  delay: 0.6,
                  duration: 0.5,
                  type: 'spring',
                }}
                className="relative"
              >
                {/* Heart glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-red-500 blur-3xl opacity-60" />
                </motion.div>

                {/* Animated heart */}
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, -10, 10, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-7xl md:text-9xl relative z-10"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(255, 0, 0, 0.8))',
                  }}
                >
                  ❤️
                </motion.div>

                {/* Small hearts orbiting */}
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 0.2,
                    }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: -40,
                      marginLeft: -40,
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="text-2xl"
                      style={{
                        position: 'absolute',
                        left: Math.cos((i * Math.PI) / 2) * 60,
                        top: Math.sin((i * Math.PI) / 2) * 60,
                      }}
                    >
                      💕
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Matched user card */}
              <motion.div
                initial={{ x: 200, rotate: 20, opacity: 0 }}
                animate={{ x: 0, rotate: 5, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                  delay: 0.4,
                }}
                className="relative"
              >
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white text-4xl md:text-6xl font-bold shadow-2xl border-4 border-white overflow-hidden">
                  {matchedProfile.photo_url ? (
                    <img
                      src={matchedProfile.photo_url}
                      alt={matchedProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    matchedProfile.name.charAt(0).toUpperCase()
                  )}
                </div>
              </motion.div>
            </div>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-white text-center text-lg md:text-xl mb-8 px-4"
            >
              You and <span className="font-bold">{matchedProfile.name}</span> both liked each other!
            </motion.p>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col md:flex-row gap-4 justify-center px-4"
            >
              <Link
                href="/matches"
                className="px-8 py-4 bg-primary-600 text-white rounded-full font-semibold text-lg hover:bg-primary-700 transition shadow-lg text-center"
              >
                Send a Message
              </Link>
              <button
                onClick={onClose}
                className="px-8 py-4 bg-white text-gray-800 rounded-full font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
              >
                Keep Swiping
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
