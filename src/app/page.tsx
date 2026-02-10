'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface QuickStats {
  totalCaptions: number
  totalLikes: number
  topCaption: string
  topLikes: number
}

export default function Home() {
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null)

  useEffect(() => {
    async function fetchQuickStats() {
      try {
        const response = await fetch('/api/caption-analytics')
        const result = await response.json()

        if (result.success) {
          const data = result.data
          setQuickStats({
            totalCaptions: data.basicStats.totalCaptions,
            totalLikes: data.basicStats.totalLikes,
            topCaption: data.topCaptions[0]?.content || '',
            topLikes: data.topCaptions[0]?.like_count || 0
          })
        }
      } catch (err) {
        console.error('Failed to fetch quick stats:', err)
      }
    }

    fetchQuickStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              📊 Caption Popularity Analysis
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover what makes captions go viral! Analyzing humor patterns, engagement metrics,
              and user preferences across <span className="font-semibold text-blue-600">
                {quickStats ? quickStats.totalCaptions.toLocaleString() : '55,000+'} captions
              </span> and <span className="font-semibold text-green-600">
                {quickStats ? quickStats.totalLikes.toLocaleString() : '300+'} likes
              </span>.
            </p>
          </div>

          {/* Quick Stats Preview */}
          {quickStats && (
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-4xl mx-auto border border-white/20 shadow-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">🏆 Most Popular Caption</h2>
              <blockquote className="text-gray-700 italic text-lg mb-2">
                "{quickStats.topCaption.substring(0, 150)}{quickStats.topCaption.length > 150 ? '...' : ''}"
              </blockquote>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-green-600">{quickStats.topLikes} likes</span> •
                Most engaging content on the platform
              </p>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/analytics"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center gap-2"
            >
              📈 View Full Analytics Dashboard
            </Link>

            <Link
              href="/images"
              className="bg-white hover:bg-gray-50 text-gray-900 font-semibold px-8 py-4 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl border border-gray-200 flex items-center gap-2"
            >
              🖼️ Browse Image Gallery
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Humor Style Analysis</h3>
            <p className="text-gray-600">
              Compare performance across different humor flavors - from Professor Chilton's special style to Dwight Shrute's factual humor.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Engagement Metrics</h3>
            <p className="text-gray-600">
              Deep dive into likes, votes, and engagement patterns to understand what resonates with users.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Top Performers</h3>
            <p className="text-gray-600">
              Discover the most liked captions and learn what makes content go viral on the platform.
            </p>
          </div>
        </div>

        {/* Key Insights Preview */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">🔍 Key Findings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Low Like Rate Discovery</h4>
                <p className="text-gray-600 text-sm">
                  Only 0.6% of captions receive likes, revealing opportunities for content optimization.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Vote Bias Pattern</h4>
                <p className="text-gray-600 text-sm">
                  65.1% downvote ratio suggests either high standards or potential bias in voting behavior.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Content Quality Gap</h4>
                <p className="text-gray-600 text-sm">
                  Top caption received 150 likes while average is 6.9, showing huge performance variation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Platform Potential</h4>
                <p className="text-gray-600 text-sm">
                  55K+ captions provide rich dataset for understanding humor and engagement patterns.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Explore detailed analytics →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-white/20">
          <p className="text-gray-600 text-sm">
            Built with Next.js & Supabase • Real-time data analysis •
            <a href="/api/test-supabase" className="text-blue-600 hover:underline ml-2">API Health →</a>
          </p>
        </div>
      </div>
    </div>
  )
}
