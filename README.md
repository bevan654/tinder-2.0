# StudyMatch - Find Your Perfect Study Partner

A Tinder-like web application for students to find and connect with study partners. Built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- **User Authentication**: Sign up and log in using email/password or Google OAuth
- **Profile Management**: Create and edit your profile with name, school, major, subjects, and bio
- **Swipe Interface**: Tinder-style card swiping to like or pass on potential study partners
- **Match Detection**: Automatic matching when two users mutually like each other
- **Real-time Chat**: Live messaging with your matches using Supabase Realtime
- **Mobile-First Design**: Responsive UI optimized for mobile and desktop

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend/Database**: Supabase (Auth, Database, Realtime, Storage)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account (free tier works)

### 1. Clone and Install

```bash
cd studymatch
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon/public key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration file located at `supabase/migrations/001_initial_schema.sql`

This will create:
- `profiles` table for user information
- `swipes` table for tracking likes/passes
- `matches` table for storing mutual matches
- `messages` table for chat messages
- Automatic triggers for match creation
- Row Level Security (RLS) policies

### 5. Configure Authentication (Optional)

#### Enable Google OAuth:

1. Go to Authentication > Providers in Supabase
2. Enable Google provider
3. Add your Google OAuth credentials
4. Add authorized redirect URL: `http://localhost:3000/auth/callback`

### 6. Enable Realtime (Optional)

**Note:** The chat works without Realtime enabled. It will automatically fall back to polling.

For instant message delivery (optional):
1. Go to Database > Replication in Supabase
2. Enable replication for the `messages` table

Without Realtime, messages will appear within 2 seconds using polling.

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### profiles
- `id` (UUID, primary key) - References auth.users
- `name` (TEXT) - User's full name
- `school` (TEXT) - School/University
- `major` (TEXT) - Field of study
- `subjects` (TEXT[]) - Array of subjects
- `bio` (TEXT) - User bio
- `photo_url` (TEXT) - Profile photo URL
- `created_at`, `updated_at` (TIMESTAMP)

### swipes
- `id` (UUID, primary key)
- `swiper_id` (UUID) - User who swiped
- `swiped_id` (UUID) - User who was swiped on
- `direction` (TEXT) - 'left' or 'right'
- `created_at` (TIMESTAMP)

### matches
- `id` (UUID, primary key)
- `user1_id` (UUID) - First user (smaller ID)
- `user2_id` (UUID) - Second user (larger ID)
- `created_at` (TIMESTAMP)

### messages
- `id` (UUID, primary key)
- `match_id` (UUID) - Related match
- `sender_id` (UUID) - Message sender
- `text` (TEXT) - Message content
- `created_at` (TIMESTAMP)

## Project Structure

```
studymatch/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts
│   ├── profile/
│   │   ├── setup/page.tsx
│   │   └── edit/page.tsx
│   ├── swipe/page.tsx
│   ├── matches/page.tsx
│   ├── chat/[matchId]/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── SwipeCard.tsx
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
├── types/
│   └── database.types.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── middleware.ts
```

## Key Features Explained

### Swipe Mechanism

The swipe interface uses Framer Motion for smooth animations. When users swipe right on each other, the database trigger automatically creates a match.

### Match Detection

Matches are created automatically via a PostgreSQL trigger function (`check_and_create_match`) when two users both swipe right on each other.

### Real-time Chat

Messages are delivered in real-time using Supabase Realtime subscriptions, providing instant communication between matched users.

### Row Level Security

All database tables have RLS policies ensuring users can only:
- View their own and public profiles
- Create swipes as themselves
- View and send messages only in their own matches

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

Update your Supabase authentication redirect URLs to include your production URL.

## Future Enhancements

- Profile photo upload via Supabase Storage
- Filter by subject, location, or school
- Typing indicators in chat
- Push notifications for new matches and messages
- Video chat integration
- Study session scheduling
- User blocking and reporting

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
