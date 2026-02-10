import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const cleanUrl = supabaseUrl?.trim()
    const cleanKey = supabaseKey?.trim().replace(/\s+/g, '')

    const supabase = createClient(cleanUrl, cleanKey)

    // Get basic statistics
    const [captionsCount, likesCount, votesCount] = await Promise.all([
      supabase.from('captions').select('*', { count: 'exact', head: true }),
      supabase.from('caption_likes').select('*', { count: 'exact', head: true }),
      supabase.from('caption_votes').select('*', { count: 'exact', head: true })
    ])

    // Get top performing captions
    const { data: topCaptions } = await supabase
      .from('captions')
      .select(`
        id,
        content,
        like_count,
        humor_flavor_id,
        humor_flavors(slug, description)
      `)
      .order('like_count', { ascending: false })
      .limit(10)

    // Get humor flavor performance
    const { data: captionsWithFlavor } = await supabase
      .from('captions')
      .select(`
        id,
        content,
        humor_flavor_id,
        like_count,
        humor_flavors!inner(id, description, slug)
      `)
      .not('humor_flavor_id', 'is', null)
      .limit(1000)

    // Process humor flavor statistics
    const flavorStats: any = {}

    if (captionsWithFlavor) {
      captionsWithFlavor.forEach((caption: any) => {
        const flavorId = caption.humor_flavor_id
        const flavorSlug = caption.humor_flavors?.slug || 'unknown'
        const flavorDesc = caption.humor_flavors?.description || 'No description'

        if (!flavorStats[flavorId]) {
          flavorStats[flavorId] = {
            id: flavorId,
            slug: flavorSlug,
            description: flavorDesc,
            captionCount: 0,
            totalLikes: 0,
            captions: []
          }
        }

        flavorStats[flavorId].captionCount++
        flavorStats[flavorId].totalLikes += caption.like_count || 0
        flavorStats[flavorId].captions.push({
          id: caption.id,
          content: caption.content,
          likes: caption.like_count || 0
        })
      })
    }

    const humorFlavorStats = Object.values(flavorStats)
      .map((flavor: any) => ({
        ...flavor,
        avgLikes: flavor.captionCount > 0 ? flavor.totalLikes / flavor.captionCount : 0
      }))
      .sort((a: any, b: any) => b.avgLikes - a.avgLikes)

    // Get vote analysis
    const { data: voteAnalysis } = await supabase
      .from('caption_votes')
      .select('vote_value')

    let voteStats = { upvotes: 0, downvotes: 0, neutrals: 0 }
    if (voteAnalysis) {
      voteStats = {
        upvotes: voteAnalysis.filter(v => v.vote_value > 0).length,
        downvotes: voteAnalysis.filter(v => v.vote_value < 0).length,
        neutrals: voteAnalysis.filter(v => v.vote_value === 0).length
      }
    }

    // Get captions with engagement
    const { data: captionsWithEngagement } = await supabase
      .from('captions')
      .select('id, like_count')
      .gt('like_count', 0)

    const engagementMetrics = {
      captionsWithLikes: captionsWithEngagement?.length || 0,
      avgLikesPerCaption: captionsWithEngagement?.length
        ? captionsWithEngagement.reduce((sum, c) => sum + (c.like_count || 0), 0) / captionsWithEngagement.length
        : 0,
      maxLikes: captionsWithEngagement?.length
        ? Math.max(...captionsWithEngagement.map(c => c.like_count || 0))
        : 0,
      likeRate: ((likesCount.count || 0) / (captionsCount.count || 1) * 100)
    }

    const analysis = {
      basicStats: {
        totalCaptions: captionsCount.count || 0,
        totalLikes: likesCount.count || 0,
        totalVotes: votesCount.count || 0
      },
      topCaptions: topCaptions || [],
      humorFlavorStats: humorFlavorStats.slice(0, 10),
      voteStats,
      engagementMetrics,
      insights: [
        `Out of ${captionsCount.count} captions, only ${engagementMetrics.captionsWithLikes} received likes (${engagementMetrics.likeRate.toFixed(1)}% like rate)`,
        `Top performing caption has ${engagementMetrics.maxLikes} likes`,
        `${voteStats.upvotes + voteStats.downvotes} votes cast with ${((voteStats.upvotes / (voteStats.upvotes + voteStats.downvotes)) * 100).toFixed(1)}% upvote ratio`,
        `Average ${engagementMetrics.avgLikesPerCaption.toFixed(1)} likes per engaging caption`
      ]
    }

    return NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Caption analytics error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}