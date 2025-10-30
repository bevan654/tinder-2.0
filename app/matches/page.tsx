'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Match = Database['public']['Tables']['matches']['Row']

interface MatchWithProfile extends Match {
  otherProfile: Profile
  lastMessage?: {
    text: string
    created_at: string
  }
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [unmatchingId, setUnmatchingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserId(user.id)

      // Get all matches for the current user
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (matchesError) throw matchesError

      // Get profiles and last messages for each match
      const matchesWithProfiles = await Promise.all(
        (matchesData || []).map(async (match) => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id

          // Get the other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single()

          // Get the last message for this match
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('text, created_at')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...match,
            otherProfile: profile!,
            lastMessage: lastMessage || undefined,
          }
        })
      )

      setMatches(matchesWithProfiles)
    } catch (error: any) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnmatch = async (matchId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Are you sure you want to unmatch? This will delete all messages and you may see each other again.')) {
      return
    }

    setUnmatchingId(matchId)

    try {
      const matchToUnmatch = matches.find(m => m.id === matchId)
      if (!matchToUnmatch || !userId) {
        throw new Error('Match not found')
      }

      // Delete messages first
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('match_id', matchId)

      if (messagesError) {
        console.error('Error deleting messages:', messagesError)
        throw new Error(`Failed to delete messages: ${messagesError.message}`)
      }

      // Delete match
      const { error: matchError } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)

      if (matchError) {
        console.error('Error deleting match:', matchError)
        throw new Error(`Failed to delete match: ${matchError.message}`)
      }

      // Delete swipe records between both users so they can appear in feeds again
      const { error: swipe1Error } = await supabase
        .from('swipes')
        .delete()
        .eq('swiper_id', userId)
        .eq('swiped_id', matchToUnmatch.otherProfile.id)

      const { error: swipe2Error } = await supabase
        .from('swipes')
        .delete()
        .eq('swiper_id', matchToUnmatch.otherProfile.id)
        .eq('swiped_id', userId)

      if (swipe1Error || swipe2Error) {
        console.error('Error deleting swipes:', swipe1Error || swipe2Error)
        // Don't throw error here, swipes deletion is less critical
      }

      // Remove from local state immediately
      setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId))
    } catch (error: any) {
      console.error('Error unmatching:', error)
      alert(`Failed to unmatch: ${error.message}`)
    } finally {
      setUnmatchingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Your Matches</h1>
          <Link
            href="/swipe"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            ← Back to Swipe
          </Link>
        </div>
      </header>

      {/* Matches List */}
      <div className="max-w-3xl mx-auto p-4">
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No matches yet
            </h2>
            <p className="text-gray-600 mb-6">
              Keep swiping to find your study partners!
            </p>
            <Link
              href="/swipe"
              className="px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition inline-block"
            >
              Start Swiping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="relative bg-white rounded-xl shadow-sm hover:shadow-md transition p-4"
              >
                <Link
                  href={`/chat/${match.id}`}
                  className="block"
                >
                <div className="flex items-center gap-4">
                  {/* Profile Picture */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {match.otherProfile.photo_url ? (
                      <img
                        src={match.otherProfile.photo_url}
                        alt={match.otherProfile.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      match.otherProfile.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Match Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {match.otherProfile.name}
                    </h3>
                    {match.otherProfile.school && (
                      <p className="text-sm text-gray-600">
                        {match.otherProfile.school}
                      </p>
                    )}
                    {match.lastMessage ? (
                      <p className="text-sm text-gray-500 truncate">
                        {match.lastMessage.text}
                      </p>
                    ) : (
                      <p className="text-sm text-primary-600 font-medium">
                        Send a message!
                      </p>
                    )}
                  </div>

                  {/* Subjects Badge */}
                  {match.otherProfile.subjects && match.otherProfile.subjects.length > 0 && (
                    <div className="hidden sm:block">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        {match.otherProfile.subjects[0]}
                        {match.otherProfile.subjects.length > 1 &&
                          ` +${match.otherProfile.subjects.length - 1}`
                        }
                      </span>
                    </div>
                  )}

                  {/* Arrow */}
                  <div className="text-gray-400">→</div>
                </div>
                </Link>

                {/* Unmatch button */}
                <button
                  onClick={(e) => handleUnmatch(match.id, e)}
                  disabled={unmatchingId === match.id}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition p-2 disabled:opacity-50"
                  title="Unmatch"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
