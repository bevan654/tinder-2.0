'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/Toast'
import { Database } from '@/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { playSound } from '@/lib/sounds'

type Profile = Database['public']['Tables']['profiles']['Row']
type Message = Database['public']['Tables']['messages']['Row']
type Match = Database['public']['Tables']['matches']['Row']

export default function ChatPage({ params }: { params: { matchId: string } }) {
  const matchId = params.matchId

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [showUnmatchModal, setShowUnmatchModal] = useState(false)
  const [unmatching, setUnmatching] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])
  const router = useRouter()
  const supabase = createClient()
  const { permission, requestPermission, sendNotification } = useNotifications()

  // Keep messages ref in sync with state
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Request notification permission on mount
  useEffect(() => {
    if (permission === 'default') {
      requestPermission()
    }
  }, [])

  useEffect(() => {
    loadChatData()
  }, [matchId])

  // Start polling and realtime only after user data is loaded
  useEffect(() => {
    if (!userId || !otherProfile) {
      console.log('Waiting for user data to load...', { userId, hasOtherProfile: !!otherProfile })
      return
    }

    console.log('User data loaded, starting message listeners')

    // Try to subscribe to realtime, but also poll as backup
    const unsubscribe = subscribeToMessages()

    // Poll for new messages every 2 seconds as backup
    const pollInterval = setInterval(() => {
      pollForNewMessages()
    }, 2000)

    return () => {
      if (unsubscribe) unsubscribe()
      clearInterval(pollInterval)
    }
  }, [userId, otherProfile, matchId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserId(user.id)

      // Get match details
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (matchError) throw matchError
      if (!matchData) throw new Error('Match not found')

      // Verify user is part of this match
      if (matchData.user1_id !== user.id && matchData.user2_id !== user.id) {
        router.push('/matches')
        return
      }

      setMatch(matchData)

      // Get other user's profile
      const otherUserId = matchData.user1_id === user.id ? matchData.user2_id : matchData.user1_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single()

      setOtherProfile(profileData)

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      setMessages(messagesData || [])
    } catch (error: any) {
      console.error('Error loading chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const pollForNewMessages = async () => {
    if (!matchId) return

    try {
      const currentMessages = messagesRef.current

      // If no messages yet, load all messages
      if (currentMessages.length === 0) {
        const { data: allMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true })

        if (allMessages && allMessages.length > 0) {
          setMessages(allMessages)
        }
      } else {
        // If we have messages, only get newer ones
        const lastMessage = currentMessages[currentMessages.length - 1]
        const { data: newMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .gt('created_at', lastMessage.created_at)
          .order('created_at', { ascending: true })

        if (newMessages && newMessages.length > 0) {
          setMessages((current) => [...current, ...newMessages])

          // Send notification for new messages from other user
          newMessages.forEach((msg) => {
            console.log('📨 New message detected:', {
              messageSenderId: msg.sender_id,
              currentUserId: userId,
              isFromOther: msg.sender_id !== userId,
              hasOtherProfile: !!otherProfile,
            })

            if (msg.sender_id !== userId && otherProfile) {
              console.log('💬 New message from other user, playing sound...')
              playSound('message')
              sendNotification(`New message from ${otherProfile.name}`, {
                body: msg.text,
                tag: `message-${msg.id}`,
              })
              // Show toast if page is visible
              if (!document.hidden) {
                setToastMessage(`${otherProfile.name}`)
                setShowToast(true)
                setTimeout(() => setShowToast(false), 2000)
              }
            } else {
              console.log('Message from self, skipping notification', {
                reason: msg.sender_id === userId ? 'sender is self' : 'no other profile',
              })
            }
          })
        }
      }
    } catch (error) {
      console.error('Error polling messages:', error)
    }
  }

  const subscribeToMessages = () => {
    try {
      const channel = supabase
        .channel(`messages:${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message
            setMessages((current) => {
              // Avoid duplicates
              const exists = current.some(m => m.id === newMsg.id)
              if (exists) return current

              // Send notification for messages from other user
              console.log('📨 Realtime message detected:', {
                messageSenderId: newMsg.sender_id,
                currentUserId: userId,
                isFromOther: newMsg.sender_id !== userId,
                hasOtherProfile: !!otherProfile,
              })

              if (newMsg.sender_id !== userId && otherProfile) {
                console.log('💬 New message via realtime, playing sound...')
                playSound('message')
                sendNotification(`New message from ${otherProfile.name}`, {
                  body: newMsg.text,
                  tag: `message-${newMsg.id}`,
                })
                // Show toast if page is visible
                if (!document.hidden) {
                  setToastMessage(`${otherProfile.name}`)
                  setShowToast(true)
                  setTimeout(() => setShowToast(false), 2000)
                }
              } else {
                console.log('Skipping notification for realtime message', {
                  reason: newMsg.sender_id === userId ? 'sender is self' : 'no other profile',
                })
              }

              return [...current, newMsg]
            })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.error('Realtime subscription failed:', error)
      return undefined
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !userId || sending) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: userId,
          text: newMessage.trim(),
        })

      if (error) throw error

      setNewMessage('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleUnmatch = async () => {
    if (!matchId || unmatching || !userId || !otherProfile) return

    setUnmatching(true)

    try {
      // Delete all messages in this match first
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('match_id', matchId)

      if (messagesError) {
        console.error('Error deleting messages:', messagesError)
        throw new Error(`Failed to delete messages: ${messagesError.message}`)
      }

      // Delete the match
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
        .eq('swiped_id', otherProfile.id)

      const { error: swipe2Error } = await supabase
        .from('swipes')
        .delete()
        .eq('swiper_id', otherProfile.id)
        .eq('swiped_id', userId)

      if (swipe1Error || swipe2Error) {
        console.error('Error deleting swipes:', swipe1Error || swipe2Error)
        // Don't throw error here, swipes deletion is less critical
      }

      // Redirect to matches page after successful deletion
      router.push('/matches')
      router.refresh()
    } catch (error: any) {
      console.error('Error unmatching:', error)
      alert(`Failed to unmatch: ${error.message}`)
      setUnmatching(false)
      setShowUnmatchModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/matches"
            className="text-gray-600 hover:text-gray-800 text-2xl"
          >
            ←
          </Link>

          {otherProfile && (
            <>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white text-xl font-bold">
                {otherProfile.photo_url ? (
                  <img
                    src={otherProfile.photo_url}
                    alt={otherProfile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  otherProfile.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-800">
                  {otherProfile.name}
                </h1>
                {otherProfile.school && (
                  <p className="text-sm text-gray-600">{otherProfile.school}</p>
                )}
              </div>

              <button
                onClick={() => playSound('message')}
                className="text-gray-400 hover:text-primary-600 transition mr-2"
                title="Test sound"
              >
                🔊
              </button>
              <button
                onClick={() => setShowUnmatchModal(true)}
                className="text-gray-400 hover:text-red-600 transition"
                title="Unmatch"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 max-w-5xl w-full mx-auto">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">👋</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Start the conversation!
              </h2>
              <p className="text-gray-600">
                Say hi to {otherProfile?.name}
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === userId

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-800'
                    }`}
                  >
                    <p className="break-words">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>

      {/* Unmatch Confirmation Modal */}
      {showUnmatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Unmatch with {otherProfile?.name}?
            </h2>
            <p className="text-gray-600 mb-6">
              This will delete your conversation and swipe history. You may see each other in the swipe feed again. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnmatchModal(false)}
                disabled={unmatching}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnmatch}
                disabled={unmatching}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {unmatching ? 'Unmatching...' : 'Unmatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        show={showToast}
        message={toastMessage}
        icon="💬"
        duration={2000}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
