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
    const { contentType } = body

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
    if (!contentType || !allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type' },
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

    // Call AlmostCrackd API to generate presigned URL
    const response = await fetch('https://api.almostcrackd.ai/pipeline/generate-presigned-url', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contentType
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('AlmostCrackd API error:', response.status, errorData)
      return NextResponse.json(
        { success: false, error: `API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      presignedUrl: data.presignedUrl,
      cdnUrl: data.cdnUrl
    })

  } catch (error) {
    console.error('Presigned URL API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}