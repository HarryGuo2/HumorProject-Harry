'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import VotingButtons from '@/components/VotingButtons'

interface Caption {
  id: string
  content: string
  like_count: number
  created_datetime_utc: string
  humor_flavor_id?: string
  image_id?: string
  humor_flavors: {
    slug: string
    description: string
  }[] | null
  images?: {
    id: string
    url: string
    image_description: string
  } | null
  vote_counts: {
    upvotes: number
    downvotes: number
    neutrals: number
  }
  user_vote: number | null
  total_votes: number
}

interface User {
  id: string
  email?: string
  user_metadata: {
    name?: string
    avatar_url?: string
    full_name?: string
  }
}

export default function CaptionsPage() {
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [captionCache, setCaptionCache] = useState<Caption[]>([])
  const [totalCaptions, setTotalCaptions] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function initialize() {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Load first caption
      await loadCaptionAtIndex(0)
      setLoading(false)
    }

    initialize()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadCaptionAtIndex = async (index: number) => {
    try {
      // Check if we have this caption in cache
      if (captionCache[index]) {
        setCurrentCaption(captionCache[index])
        setCurrentIndex(index)
        return
      }

      // Fetch caption from API using random sorting to get variety
      const response = await fetch(`/api/captions?limit=1&offset=${index}&sort=random`, {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success && result.data.captions.length > 0) {
        const caption = result.data.captions[0]
        setCurrentCaption(caption)
        setCurrentIndex(index)
        setTotalCaptions(result.data.pagination.total)

        // Add to cache
        setCaptionCache(prev => {
          const newCache = [...prev]
          newCache[index] = caption
          return newCache
        })
      }
    } catch (error) {
      console.error('Failed to load caption:', error)
    }
  }

  const handleNext = async () => {
    if (currentIndex < totalCaptions - 1) {
      setLoading(true)
      await loadCaptionAtIndex(currentIndex + 1)
      setLoading(false)
    }
  }

  const handlePrevious = async () => {
    if (currentIndex > 0) {
      setLoading(true)
      await loadCaptionAtIndex(currentIndex - 1)
      setLoading(false)
    }
  }

  const handleVoteChange = (captionId: string, newVoteCounts: any, userVote: number | null) => {
    // Update current caption
    if (currentCaption?.id === captionId) {
      setCurrentCaption(prev => prev ? { ...prev, vote_counts: newVoteCounts, user_vote: userVote } : null)
    }

    // Update cache
    setCaptionCache(prev => prev.map(caption =>
      caption?.id === captionId
        ? { ...caption, vote_counts: newVoteCounts, user_vote: userVote }
        : caption
    ))

    // Automatically go to next caption after voting
    setTimeout(() => {
      if (currentIndex < totalCaptions - 1) {
        handleNext()
      }
    }, 1500) // Give user time to see their vote registered
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || 'User'

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
              <h1 className="text-2xl font-bold text-gray-900">Caption Voting</h1>
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {user.user_metadata?.avatar_url && (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={userName}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-gray-700">Hello, {userName}!</span>
                </div>

                <Link
                  href="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">🗳️ Rate Captions</h2>
          <p className="text-blue-800 mb-3">
            Help improve the platform by rating captions! Your votes help identify the funniest content.
          </p>
          {!user && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-yellow-800 text-sm">
                🔒 <Link href="/" className="font-semibold underline">Login</Link> to vote on captions and track your voting activity.
              </p>
            </div>
          )}
        </div>

        {/* Caption Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading caption...</p>
          </div>
        ) : currentCaption ? (
          <div className="max-w-2xl mx-auto">
            {/* Single Caption Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Image Section */}
              {currentCaption.images && (
                <div className="aspect-square md:aspect-video bg-gray-100">
                  <img
                    src={currentCaption.images.url}
                    alt={currentCaption.images.image_description || 'Caption image'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzEzNi4xOSAxMDAgMTI1IDExMS4xOSAxMjUgMTI1UzEzNi4xOSAxNTAgMTUwIDE1MFMxNzUgMTM4LjgxIDE3NSAxMjVTMTYzLjgxIDEwMCAxNTAgMTAwWk0xNTAgMTM3LjVDMTQzLjA5IDEzNy41IDEzNy41IDEzMS45MSAxMzcuNSAxMjVTMTQzLjA5IDExMi41IDE1MCAxMTIuNVMxNjIuNSAxMTguMDkgMTYyLjUgMTI1UzE1Ni45MSAxMzcuNSAxNTAgMTM3LjVaIiBmaWxsPSIjOUM5QzlDIi8+CjxwYXRoIGQ9Ik0yMDAgMTc1SDEwMEw4NyAyMDBIMjEzTDIwMCAxNzVaIiBmaWxsPSIjOUM5QzlDIi8+Cjwvc3ZnPg=='
                    }}
                  />
                </div>
              )}

              {/* Content Section */}
              <div className="p-8">
                {/* Caption Text */}
                <div className="mb-6">
                  <p className="text-gray-800 text-xl leading-relaxed text-center">
                    "{currentCaption.content || '(No caption text)'}"
                  </p>
                </div>

                {/* Image Description (if no caption content) */}
                {!currentCaption.content && currentCaption.images?.image_description && (
                  <div className="mb-6">
                    <p className="text-gray-600 text-sm italic text-center">
                      Image: {currentCaption.images.image_description}
                    </p>
                  </div>
                )}

                {/* Stats and Voting */}
                <div className="flex flex-col items-center space-y-4">
                  <VotingButtons
                    captionId={currentCaption.id}
                    initialVoteCounts={currentCaption.vote_counts}
                    userVote={currentCaption.user_vote}
                    isLoggedIn={!!user}
                    onVoteChange={(newVoteCounts, userVote) =>
                      handleVoteChange(currentCaption.id, newVoteCounts, userVote)
                    }
                  />

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{currentCaption.like_count || 0} likes</span>
                    <span>{new Date(currentCaption.created_datetime_utc).toLocaleDateString()}</span>
                    {currentCaption.humor_flavors && Array.isArray(currentCaption.humor_flavors) && currentCaption.humor_flavors.length > 0 && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {currentCaption.humor_flavors[0]?.slug}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0 || loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <span>←</span>
                <span>Previous</span>
              </button>

              <div className="text-sm text-gray-500">
                {currentIndex + 1} of {totalCaptions}
              </div>

              <button
                onClick={handleNext}
                disabled={currentIndex >= totalCaptions - 1 || loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg">No captions found</p>
            <p className="text-sm mt-1">Check back later for new content.</p>
          </div>
        )}
      </div>
    </div>
  )
}