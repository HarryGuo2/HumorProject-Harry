'use client'

import { useEffect, useState } from 'react'

interface AnalyticsData {
  basicStats: {
    totalCaptions: number
    totalLikes: number
    totalVotes: number
  }
  topCaptions: Array<{
    id: string
    content: string
    like_count: number
    humor_flavors?: {
      slug: string
      description: string
    }
  }>
  humorFlavorStats: Array<{
    id: number
    slug: string
    description: string
    captionCount: number
    totalLikes: number
    avgLikes: number
  }>
  voteStats: {
    upvotes: number
    downvotes: number
    neutrals: number
  }
  engagementMetrics: {
    captionsWithLikes: number
    avgLikesPerCaption: number
    maxLikes: number
    likeRate: number
  }
  insights: string[]
}

export default function CaptionAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/caption-analytics')
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Failed to fetch analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Loading caption analytics...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-600">Error: {error || 'No data available'}</div>
      </div>
    )
  }

  const upvoteRate = data.voteStats.upvotes + data.voteStats.downvotes > 0
    ? (data.voteStats.upvotes / (data.voteStats.upvotes + data.voteStats.downvotes) * 100).toFixed(1)
    : '0'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📊 Caption Popularity Analysis
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            What makes captions popular? Analyzing engagement patterns across different humor styles,
            vote distributions, and top-performing content from our humor platform.
          </p>
        </div>

        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {data.basicStats.totalCaptions.toLocaleString()}
            </div>
            <div className="text-gray-600">Total Captions</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {data.basicStats.totalLikes.toLocaleString()}
            </div>
            <div className="text-gray-600">Total Likes</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {data.basicStats.totalVotes.toLocaleString()}
            </div>
            <div className="text-gray-600">Total Votes</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {data.engagementMetrics.likeRate.toFixed(1)}%
            </div>
            <div className="text-gray-600">Like Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Top Performing Captions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 Top Performing Captions</h2>

            <div className="space-y-4">
              {data.topCaptions.slice(0, 5).map((caption, index) => (
                <div key={caption.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {caption.like_count} likes
                    </span>
                  </div>
                  <p className="text-gray-800 mb-1">
                    "{caption.content?.substring(0, 120)}{caption.content && caption.content.length > 120 ? '...' : ''}"
                  </p>
                  {caption.humor_flavors?.slug && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {caption.humor_flavors.slug}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 Engagement Insights</h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Captions with Likes</span>
                  <span className="font-semibold">{data.engagementMetrics.captionsWithLikes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(data.engagementMetrics.captionsWithLikes / data.basicStats.totalCaptions) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Average Likes per Caption</span>
                  <span className="font-semibold">{data.engagementMetrics.avgLikesPerCaption.toFixed(1)}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Top Caption Performance</span>
                  <span className="font-semibold">{data.engagementMetrics.maxLikes} likes</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Vote Distribution</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-600">👍 Upvotes</span>
                  <span className="font-semibold">{data.voteStats.upvotes}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-red-600">👎 Downvotes</span>
                  <span className="font-semibold">{data.voteStats.downvotes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upvote Rate</span>
                  <span className="font-semibold text-green-600">{upvoteRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Humor Flavors Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🎭 Humor Flavor Performance</h2>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Humor Style</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Captions</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Likes</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Likes</th>
                </tr>
              </thead>
              <tbody>
                {data.humorFlavorStats.slice(0, 8).map((flavor, index) => (
                  <tr key={flavor.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{flavor.slug}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600 text-sm">
                        {flavor.description.substring(0, 60)}{flavor.description.length > 60 ? '...' : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{flavor.captionCount}</td>
                    <td className="py-3 px-4 text-right font-medium">{flavor.totalLikes}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${flavor.avgLikes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {flavor.avgLikes.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">💡 Key Insights</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <p className="text-gray-700 text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Caption Analytics Dashboard • Updated in real-time •
            <a href="/images" className="text-blue-500 hover:underline ml-2">View Image Gallery →</a>
          </p>
        </div>
      </div>
    </div>
  )
}