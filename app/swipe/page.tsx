'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import SwipeCard from '@/components/SwipeCard'
import Link from 'next/link'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function SwipePage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [showMatch, setShowMatch] = useState(false)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const router = useRouter()
  const supabase = createClient()

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

      // If right swipe, check for match
      if (direction === 'right') {
        const { data: reciprocalSwipe } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', swipedProfile.id)
          .eq('swiped_id', userId)
          .eq('direction', 'right')
          .single()

        if (reciprocalSwipe) {
          // It's a match!
          setMatchedProfile(swipedProfile)
          setShowMatch(true)
          setTimeout(() => setShowMatch(false), 3000)
        }
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
              className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-semibold hover:bg-primary-200 transition"
            >
              💬 Matches
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

      {/* Match Modal */}
      {showMatch && matchedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-primary-600 mb-2">
              It&apos;s a Match!
            </h2>
            <p className="text-gray-700 mb-6">
              You and {matchedProfile.name} both liked each other!
            </p>
            <Link
              href="/matches"
              className="px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition inline-block"
            >
              Send a Message
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
