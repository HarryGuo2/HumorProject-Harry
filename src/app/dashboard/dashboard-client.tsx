'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email?: string
  user_metadata: {
    name?: string
    avatar_url?: string
    full_name?: string
  }
  created_at: string
}

interface UserCaption {
  id: string
  content: string
  like_count: number
  created_datetime_utc: string
  humor_flavor_id?: string
  humor_flavors: {
    slug: string
    description: string
  }[] | null
}

interface UserStats {
  totalCaptions: number
  totalLikes: number
  likesGiven: number
  votesGiven: number
  upvotesGiven: number
  downvotesGiven: number
  joinedDate: string
}

interface Props {
  user: User
  userCaptions: UserCaption[]
  userStats: UserStats
}

export default function DashboardClient({ user, userCaptions, userStats }: Props) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email || 'User'
  const userAvatar = user.user_metadata?.avatar_url

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/analytics-home" className="text-blue-600 hover:text-blue-700 font-semibold">
                ← Back to Analytics
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {userAvatar && (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-gray-700">Hello, {userName}!</span>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">🎉 Welcome to Your Personal Dashboard!</h2>
          <p className="text-blue-100 text-lg">
            This is a protected route - only authenticated users can see this content.
            You're successfully logged in with Google OAuth!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {userStats.totalCaptions}
            </div>
            <div className="text-gray-600 text-sm">Your Captions</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {userStats.totalLikes}
            </div>
            <div className="text-gray-600 text-sm">Likes Received</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {userStats.likesGiven}
            </div>
            <div className="text-gray-600 text-sm">Likes Given</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-indigo-600 mb-1">
              {userStats.votesGiven}
            </div>
            <div className="text-gray-600 text-sm">Total Votes</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {userStats.upvotesGiven}
            </div>
            <div className="text-gray-600 text-sm">👍 Upvotes</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {Math.floor((Date.now() - new Date(userStats.joinedDate).getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-gray-600 text-sm">Days Active</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Profile */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">👤 Your Profile</h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <div className="text-gray-900 font-medium">{userName}</div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Email</label>
                <div className="text-gray-900 font-medium">{user.email || 'Not provided'}</div>
              </div>

              <div>
                <label className="text-sm text-gray-600">User ID</label>
                <div className="text-gray-500 text-sm font-mono">{user.id}</div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Joined</label>
                <div className="text-gray-900">
                  {new Date(userStats.joinedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Captions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">💬 Your Recent Captions</h3>

            {userCaptions.length > 0 ? (
              <div className="space-y-4">
                {userCaptions.slice(0, 5).map((caption, index) => (
                  <div key={caption.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="text-gray-800 mb-1">
                      "{caption.content.substring(0, 100)}{caption.content.length > 100 ? '...' : ''}"
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>{caption.like_count || 0} likes</span>
                      <span>{new Date(caption.created_datetime_utc).toLocaleDateString()}</span>
                      {caption.humor_flavors && caption.humor_flavors.length > 0 && (
                        <span className="bg-gray-100 px-2 py-1 rounded">{caption.humor_flavors[0].slug}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💭</div>
                <p>You haven't created any captions yet!</p>
                <p className="text-sm mt-1">Start creating funny captions to see them here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <Link
            href="/upload"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            📸 Upload & Generate Captions
          </Link>

          <Link
            href="/captions"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            🗳️ Vote on Captions
          </Link>

          <Link
            href="/analytics"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            📊 View Analytics Dashboard
          </Link>

          <Link
            href="/images"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            🖼️ Browse Image Gallery
          </Link>
        </div>
      </div>
    </div>
  )
}