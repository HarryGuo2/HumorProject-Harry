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
  const [captions, setCaptions] = useState<Caption[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function initialize() {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Load captions
      await loadCaptions(true)
      setLoading(false)
    }

    initialize()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadCaptions = async (reset = false) => {
    try {
      const offset = reset ? 0 : captions.length
      const response = await fetch(`/api/captions?limit=10&offset=${offset}&sort=${sortBy}`, {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success) {
        const newCaptions = result.data.captions
        setCaptions(reset ? newCaptions : [...captions, ...newCaptions])
        setHasMore(result.data.pagination.hasMore)
      }
    } catch (error) {
      console.error('Failed to load captions:', error)
    }
  }

  const handleSortChange = async (newSort: string) => {
    setSortBy(newSort)
    setLoading(true)

    try {
      const response = await fetch(`/api/captions?limit=10&offset=0&sort=${newSort}`, {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success) {
        setCaptions(result.data.captions)
        setHasMore(result.data.pagination.hasMore)
      }
    } catch (error) {
      console.error('Failed to load captions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    await loadCaptions(false)
    setLoadingMore(false)
  }

  const handleVoteChange = (captionId: string, newVoteCounts: any, userVote: number | null) => {
    setCaptions(prev => prev.map(caption =>
      caption.id === captionId
        ? { ...caption, vote_counts: newVoteCounts, user_vote: userVote }
        : caption
    ))
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

        {/* Sort Controls */}
        <div className="flex items-center space-x-4 mb-6">
          <span className="text-gray-600 font-medium">Sort by:</span>
          <div className="flex space-x-2">
            {[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
              { value: 'most_liked', label: 'Most Liked' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                disabled={loading}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Captions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading captions...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {captions.map(caption => (
              <div key={caption.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Image Section */}
                {caption.images && (
                  <div className="aspect-square md:aspect-video bg-gray-100">
                    <img
                      src={caption.images.url}
                      alt={caption.images.image_description || 'Caption image'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzEzNi4xOSAxMDAgMTI1IDExMS4xOSAxMjUgMTI1UzEzNi4xOSAxNTAgMTUwIDE1MFMxNzUgMTM4LjgxIDE3NSAxMjVTMTYzLjgxIDEwMCAxNTAgMTAwWk0xNTAgMTM3LjVDMTQzLjA5IDEzNy41IDEzNy41IDEzMS45MSAxMzcuNSAxMjVTMTQzLjA5IDExMi41IDE1MCAxMTIuNVMxNjIuNSAxMTguMDkgMTYyLjUgMTI1UzE1Ni45MSAxMzcuNSAxNTAgMTM3LjVaIiBmaWxsPSIjOUM5QzlDIi8+CjxwYXRoIGQ9Ik0yMDAgMTc1SDEwMEw4NyAyMDBIMjEzTDIwMCAxNzVaIiBmaWxsPSIjOUM5QzlDIi8+Cjwvc3ZnPg=='
                      }}
                    />
                  </div>
                )}

                {/* Content Section */}
                <div className="p-6">
                  {/* Caption Text */}
                  <div className="mb-4">
                    <p className="text-gray-800 text-lg leading-relaxed">
                      "{caption.content || '(No caption text)'}"
                    </p>
                  </div>

                  {/* Image Description (if no caption content) */}
                  {!caption.content && caption.images?.image_description && (
                    <div className="mb-4">
                      <p className="text-gray-600 text-sm italic">
                        Image: {caption.images.image_description}
                      </p>
                    </div>
                  )}

                  {/* Stats and Voting */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{caption.like_count || 0} likes</span>
                      <span>{new Date(caption.created_datetime_utc).toLocaleDateString()}</span>
                      {caption.humor_flavors && Array.isArray(caption.humor_flavors) && caption.humor_flavors.length > 0 && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {caption.humor_flavors[0]?.slug}
                        </span>
                      )}
                    </div>

                    <VotingButtons
                      captionId={caption.id}
                      initialVoteCounts={caption.vote_counts}
                      userVote={caption.user_vote}
                      isLoggedIn={!!user}
                      onVoteChange={(newVoteCounts, userVote) =>
                        handleVoteChange(caption.id, newVoteCounts, userVote)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading more...
                    </div>
                  ) : (
                    'Load More Captions'
                  )}
                </button>
              </div>
            )}

            {!hasMore && captions.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>🎉 You've seen all available captions!</p>
                <p className="text-sm mt-1">Check back later for new content.</p>
              </div>
            )}

            {captions.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-lg">No captions found</p>
                <p className="text-sm mt-1">Try a different sort option or check back later.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}