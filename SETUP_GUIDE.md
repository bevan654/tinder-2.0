# StudyMatch - Quick Setup Guide

Follow these steps to get StudyMatch running locally in under 10 minutes.

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)

```bash
cd studymatch
npm install
```

### 2. Create Supabase Project (3 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in:
   - Project name: "StudyMatch"
   - Database password: (save this somewhere safe)
   - Region: Choose closest to you
4. Wait for project to be created (~2 minutes)

### 3. Get Supabase Credentials (1 minute)

1. In your Supabase project, go to **Settings** (gear icon) > **API**
2. Copy:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

### 4. Configure Environment Variables (30 seconds)

Create a `.env.local` file in the `studymatch` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual values from Step 3.

### 5. Set Up Database (2 minutes)

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" or press Ctrl+Enter
6. You should see "Success. No rows returned"

### 6. Enable Authentication (1 minute)

1. In Supabase, go to **Authentication** > **Providers**
2. **Email** should already be enabled
3. (Optional) For Google OAuth:
   - Enable "Google" provider
   - Follow instructions to add Google credentials
   - Add redirect URL: `http://localhost:3000/auth/callback`

### 7. Enable Realtime for Chat (Optional)

**Note: This step is optional. The chat will work with or without Realtime enabled.**

If you have access to Realtime features:
1. In Supabase, go to **Database** > **Replication**
2. Find the **messages** table
3. Toggle the switch to enable replication

If you don't have access (free tier limitations), the chat will automatically use polling instead (checks for new messages every 2 seconds).

### 8. Start the App! (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing the App

### Create Test Users

1. Sign up with two different email addresses (you can use temp email services)
2. For each user:
   - Complete profile setup
   - Add subjects you study
   - Add a bio

### Test Swiping

1. Log in as User 1
2. Swipe right on User 2's profile
3. Log out and log in as User 2
4. Swipe right on User 1's profile
5. You should see a "It's a Match!" popup!

### Test Chat

1. Click "Matches" in the header
2. Click on your match
3. Send messages back and forth
4. Open another browser/incognito window with the other user
5. Watch messages appear in real-time!

## Common Issues

### "Invalid API key" or connection errors

- Double-check your `.env.local` file has correct values
- Make sure file is named `.env.local` (not `.env.local.txt`)
- Restart the dev server after changing environment variables

### Database errors

- Make sure you ran the migration SQL file completely
- Check Supabase dashboard for any error messages
- Verify all tables were created: profiles, swipes, matches, messages

### Authentication not working

- Check that Email provider is enabled in Supabase
- For localhost, make sure redirect URL includes `http://localhost:3000/auth/callback`
- Check browser console for error messages

### Real-time messages not working

- Messages should appear within 2 seconds (polling fallback)
- If Realtime is available, messages appear instantly
- Check browser console for any error messages
- Ensure both users are in the same match
- Try refreshing the page

## Next Steps

- Add profile photos using Supabase Storage
- Customize the UI colors in `tailwind.config.ts`
- Deploy to Vercel (see README.md)
- Add more subjects in the profile setup page

## Need Help?

- Check the full README.md for detailed documentation
- Review Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Check Next.js docs: [nextjs.org/docs](https://nextjs.org/docs)

Happy studying! 📚
