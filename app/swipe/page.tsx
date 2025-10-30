'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import SwipeCard from '@/components/SwipeCard'
import MatchAnimation from '@/components/MatchAnimation'
import Toast from '@/components/Toast'
import Link from 'next/link'
import { Database } from '@/types/database.types'
import { playSound } from '@/lib/sounds'
import { useUnreadCount } from '@/lib/hooks/useUnreadCount'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function SwipePage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null)
  const [showMatch, setShowMatch] = useState(false)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const unreadCount = useUnreadCount(userId)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserId(user.id)

      // Check if user has a profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!userProfile) {
        router.push('/profile/setup')
        return
      }

      setCurrentUserProfile(userProfile)

      // Get all swipes by this user
      const { data: swipes } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id)

      const swipedIds = swipes?.map(s => s.swiped_id) || []

      // Get profiles excluding current user and already swiped profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)

      // Only filter by swiped IDs if there are any
      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`)
      }

      const { data: availableProfiles, error } = await query
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setProfiles(availableProfiles || [])
    } catch (error: any) {
      console.error('Error loading profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!userId || currentIndex >= profiles.length) return

    const swipedProfile = profiles[currentIndex]

    try {
      // Insert swipe
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          swiper_id: userId,
          swiped_id: swipedProfile.id,
          direction,
        })

      if (swipeError) throw swipeError

      // If right swipe, check if a match was created by the database trigger
      if (direction === 'right') {
        console.log('Checking for match...')
        console.log('Current user:', userId)
        console.log('Swiped user:', swipedProfile.id)

        // Small delay to let the database trigger finish
        await new Promise(resolve => setTimeout(resolve, 500))

        // Check if a match exists between these users
        const smallerId = userId < swipedProfile.id ? userId : swipedProfile.id
        const largerId = userId < swipedProfile.id ? swipedProfile.id : userId

        const { data: matchExists, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('user1_id', smallerId)
          .eq('user2_id', largerId)
          .maybeSingle()

        console.log('Match found:', matchExists)
        console.log('Match error:', matchError)

        if (matchExists) {
          // It's a match!
          console.log('🎉 MATCH DETECTED! Playing animation...')
          playSound('match')
          setMatchedProfile(swipedProfile)
          setShowMatch(true)
        } else {
          console.log('No match yet - waiting for them to swipe back')
        }
      } else {
        // Play swipe sound for left swipes too
        playSound('swipe')
      }

      // Show toast notification
      if (direction === 'right') {
        setToastMessage(`You liked ${swipedProfile.name}`)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
      }

      // Move to next profile
      setCurrentIndex(currentIndex + 1)
    } catch (error: any) {
      console.error('Error swiping:', error)
    }
  }

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    handleSwipe(direction)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
        </div>
      </div>
    )
  }

  const currentProfile = profiles[currentIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">StudyMatch</h1>
          <div className="flex gap-4">
            <Link
              href="/matches"
              className="relative px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-semibold hover:bg-primary-200 transition"
            >
              💬 Matches
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/profile/edit"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              ⚙️ Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        {currentProfile ? (
          <>
            <div className="relative w-full max-w-sm h-[600px] mb-8">
              {profiles.slice(currentIndex, currentIndex + 3).map((profile, index) => (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  onSwipe={handleSwipe}
                  style={{
                    zIndex: 3 - index,
                    scale: 1 - index * 0.05,
                    y: index * 10,
                  }}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-6">
              <button
                onClick={() => handleButtonSwipe('left')}
                className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition border-2 border-red-500 text-red-500"
              >
                ✕
              </button>
              <button
                onClick={() => handleButtonSwipe('right')}
                className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition border-2 border-green-500 text-green-500"
              >
                ♥
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No more profiles!
            </h2>
            <p className="text-gray-600 mb-6">
              Check back later for new study partners
            </p>
            <Link
              href="/matches"
              className="px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition inline-block"
            >
              View Your Matches
            </Link>
          </div>
        )}
      </div>

      {/* Match Animation */}
      <MatchAnimation
        show={showMatch}
        currentUserProfile={currentUserProfile}
        matchedProfile={matchedProfile}
        onClose={() => setShowMatch(false)}
      />

      {/* Toast Notification */}
      <Toast
        show={showToast}
        message={toastMessage}
        icon="❤️"
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
