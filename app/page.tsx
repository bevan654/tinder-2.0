import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-pink-50 to-red-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-bold text-primary-600 mb-2">
            📚 StudyMatch
          </h1>
          <p className="text-2xl text-gray-700 mb-8">
            Find Your Perfect Study Partner
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="block w-full bg-primary-600 text-white rounded-full py-4 px-6 font-semibold text-lg hover:bg-primary-700 transition"
          >
            Log In
          </Link>
          <Link
            href="/auth/signup"
            className="block w-full bg-white text-primary-600 border-2 border-primary-600 rounded-full py-4 px-6 font-semibold text-lg hover:bg-primary-50 transition"
          >
            Sign Up
          </Link>
        </div>

        <p className="text-gray-600 text-sm mt-8">
          Connect with students who share your academic interests.
          <br />
          Swipe, match, and study together!
        </p>
      </div>
    </main>
  );
}
