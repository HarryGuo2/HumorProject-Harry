import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Use anon client for captions fetch - avoids cookie/session issues that can cause empty data
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl?.trim(), supabaseKey?.trim().replace(/\s+/g, ''))

    // Server client for user-specific data (votes) - needs cookies for auth
    const serverSupabase = await createServerClient()
    const { data: { user } } = await serverSupabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort') || 'newest' // newest, most_liked, most_voted

    let orderBy = 'created_datetime_utc'
    let ascending = false

    switch (sortBy) {
      case 'most_liked':
        orderBy = 'like_count'
        break
      case 'oldest':
        orderBy = 'created_datetime_utc'
        ascending = true
        break
      default: // newest
        orderBy = 'created_datetime_utc'
        ascending = false
    }

    // Get captions with basic info including images - use anon client for reliable data fetch
    const { data: captions, error } = await supabase
      .from('captions')
      .select(`
        id,
        content,
        like_count,
        created_datetime_utc,
        humor_flavor_id,
        image_id,
        humor_flavors!left(slug, description),
        images!left(id, url, image_description)
      `)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Get vote counts for these captions
    const captionIds = captions?.map(c => c.id) || []

    const { data: allVotes } = await supabase
      .from('caption_votes')
      .select('caption_id, vote_value')
      .in('caption_id', captionIds)

    // Get user's votes for these captions if logged in (uses server client for auth)
    let userVotes: any[] = []
    if (user && captionIds.length > 0) {
      const { data: userVoteData } = await serverSupabase
        .from('caption_votes')
        .select('caption_id, vote_value')
        .eq('profile_id', user.id)
        .in('caption_id', captionIds)

      userVotes = userVoteData || []
    }

    // Process vote counts and normalize relationships (PostgREST returns object for many-to-one, frontend expects array)
    const captionsWithVotes = captions?.map(caption => {
      const captionVotes = allVotes?.filter(v => v.caption_id === caption.id) || []
      const userVote = userVotes.find(v => v.caption_id === caption.id)

      const voteCounts = {
        upvotes: captionVotes.filter(v => v.vote_value > 0).length,
        downvotes: captionVotes.filter(v => v.vote_value < 0).length,
        neutrals: captionVotes.filter(v => v.vote_value === 0).length
      }

      // Normalize humor_flavors to array
      const humorFlavors = caption.humor_flavors
        ? Array.isArray(caption.humor_flavors)
          ? caption.humor_flavors
          : [caption.humor_flavors]
        : null

      // Normalize images - PostgREST returns object for many-to-one relationship
      const images = caption.images && typeof caption.images === 'object' && !Array.isArray(caption.images)
        ? caption.images
        : null

      return {
        ...caption,
        humor_flavors: humorFlavors,
        images: images,
        vote_counts: voteCounts,
        user_vote: userVote?.vote_value ?? null,
        total_votes: voteCounts.upvotes + voteCounts.downvotes + voteCounts.neutrals
      }
    })

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('captions')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      data: {
        captions: captionsWithVotes,
        pagination: {
          total: totalCount || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (totalCount || 0)
        }
      }
    })

  } catch (error) {
    console.error('Captions API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch captions' },
      { status: 500 }
    )
  }
}