export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          school: string | null
          major: string | null
          subjects: string[] | null
          bio: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          school?: string | null
          major?: string | null
          subjects?: string[] | null
          bio?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          school?: string | null
          major?: string | null
          subjects?: string[] | null
          bio?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      swipes: {
        Row: {
          id: string
          swiper_id: string
          swiped_id: string
          direction: 'left' | 'right'
          created_at: string
        }
        Insert: {
          id?: string
          swiper_id: string
          swiped_id: string
          direction: 'left' | 'right'
          created_at?: string
        }
        Update: {
          id?: string
          swiper_id?: string
          swiped_id?: string
          direction?: 'left' | 'right'
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          text?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
