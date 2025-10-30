'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Database } from '@/types/database.types'
import { formatDistanceToNow } from 'date-fns'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Keep messages ref in sync with state
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    loadChatData()

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
  }, [matchId])

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
            setMessages((current) => {
              // Avoid duplicates
              const exists = current.some(m => m.id === payload.new.id)
              if (exists) return current
              return [...current, payload.new as Message]
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
    </div>
  )
}
