import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { imageId } = body

    // Validate image ID
    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'Image ID is required' },
        { status: 400 }
      )
    }

    // Get JWT token from auth header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      )
    }

    // Call AlmostCrackd API to generate captions
    const response = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageId
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('AlmostCrackd generate captions API error:', response.status, errorData)
      return NextResponse.json(
        { success: false, error: `API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Return the generated captions
    return NextResponse.json(data)

  } catch (error) {
    console.error('Generate captions API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}