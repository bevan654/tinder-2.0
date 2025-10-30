import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadCount(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const checkUnreadMessages = async () => {
      try {
        // Get all matches for user
        const { data: matches } = await supabase
          .from('matches')
          .select('id')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

        if (!matches || matches.length === 0) {
          setUnreadCount(0)
          return
        }

        const matchIds = matches.map(m => m.id)

        // Get latest message in each match
        let totalUnread = 0
        for (const matchId of matchIds) {
          const { data: messages } = await supabase
            .from('messages')
            .select('sender_id, created_at')
            .eq('match_id', matchId)
            .order('created_at', { ascending: false })
            .limit(1)

          // If latest message is from other user, consider it unread
          if (messages && messages.length > 0 && messages[0].sender_id !== userId) {
            totalUnread++
          }
        }

        setUnreadCount(totalUnread)
      } catch (error) {
        console.error('Error checking unread messages:', error)
      }
    }

    checkUnreadMessages()

    // Poll every 10 seconds
    const interval = setInterval(checkUnreadMessages, 10000)

    return () => clearInterval(interval)
  }, [userId])

  return unreadCount
}
