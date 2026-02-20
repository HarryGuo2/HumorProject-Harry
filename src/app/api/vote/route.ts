import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication with debugging
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('Vote API Debug:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      cookies: request.cookies.getAll().map(c => c.name)
    })

    if (authError || !user) {
      console.log('Authentication failed:', { authError: authError?.message, user: !!user })
      return NextResponse.json(
        { success: false, error: 'Authentication required', debug: { authError: authError?.message } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { caption_id, vote_value } = body

    // Validate input
    if (!caption_id || vote_value === undefined) {
      return NextResponse.json(
        { success: false, error: 'caption_id and vote_value are required' },
        { status: 400 }
      )
    }

    if (![1, -1, 0].includes(vote_value)) {
      return NextResponse.json(
        { success: false, error: 'vote_value must be 1 (upvote), -1 (downvote), or 0 (neutral)' },
        { status: 400 }
      )
    }

    // Check if user has already voted on this caption
    const { data: existingVote } = await supabase
      .from('caption_votes')
      .select('id, vote_value')
      .eq('caption_id', caption_id)
      .eq('profile_id', user.id)
      .single()

    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabase
        .from('caption_votes')
        .update({ vote_value })
        .eq('id', existingVote.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating vote:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to update vote' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          action: 'updated',
          vote: data,
          previous_vote: existingVote.vote_value
        }
      })
    } else {
      // Create new vote - try profile_id first; some schemas use user_id
      const insertPayload: Record<string, unknown> = {
        caption_id,
        vote_value
      }
      insertPayload.profile_id = user.id

      const { data, error } = await supabase
        .from('caption_votes')
        .insert(insertPayload)
        .select()
        .single()

      if (error) {
        console.error('Error creating vote:', error)
        const errorMessage = error.message || 'Failed to create vote'
        const errorCode = (error as { code?: string }).code
        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            ...(errorCode && { code: errorCode })
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          action: 'created',
          vote: data
        }
      })
    }

  } catch (error) {
    console.error('Vote API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user (optional for GET)
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const caption_id = searchParams.get('caption_id')

    if (!caption_id) {
      return NextResponse.json(
        { success: false, error: 'caption_id is required' },
        { status: 400 }
      )
    }

    // Get vote summary for this caption
    const { data: votes } = await supabase
      .from('caption_votes')
      .select('vote_value')
      .eq('caption_id', caption_id)

    const voteCounts = {
      upvotes: votes?.filter(v => v.vote_value > 0).length || 0,
      downvotes: votes?.filter(v => v.vote_value < 0).length || 0,
      neutrals: votes?.filter(v => v.vote_value === 0).length || 0
    }

    let userVote = null
    if (user) {
      const { data: userVoteData } = await supabase
        .from('caption_votes')
        .select('vote_value')
        .eq('caption_id', caption_id)
        .eq('profile_id', user.id)
        .single()

      userVote = userVoteData?.vote_value || null
    }

    return NextResponse.json({
      success: true,
      data: {
        caption_id,
        vote_counts: voteCounts,
        user_vote: userVote,
        total_votes: voteCounts.upvotes + voteCounts.downvotes + voteCounts.neutrals
      }
    })

  } catch (error) {
    console.error('Get vote API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}