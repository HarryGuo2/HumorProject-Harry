'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Image {
  id: string
  url: string
  image_description: string
  celebrity_recognition: string | null
  additional_context: string | null
  is_public: boolean
  created_datetime_utc: string
}

export default function ImagesPage() {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImages() {
      try {
        // Debug environment variables
        console.log('Environment check:', {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
        })

        const { data, error } = await supabase
          .from('images')
          .select('*')
          .eq('is_public', true)
          .order('created_datetime_utc', { ascending: false })

        console.log('Supabase response:', { data: data?.length, error })

        if (error) {
          throw error
        }

        setImages(data || [])
      } catch (err) {
        console.error('Fetch error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  const parseCelebrityRecognition = (recognition: string | null) => {
    if (!recognition) return null
    try {
      const parsed = JSON.parse(recognition)
      return parsed.content?.[0]?.name || null
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading images...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Image Gallery from Supabase</h1>
      <p className="text-center text-gray-600 mb-8">
        Displaying {images.length} public images from Supabase
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => {
          const celebrityName = parseCelebrityRecognition(image.celebrity_recognition)

          return (
            <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={image.image_description || 'Image'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzEzNi4xOSAxMDAgMTI1IDExMS4xOSAxMjUgMTI1UzEzNi4xOSAxNTAgMTUwIDE1MFMxNzUgMTM4LjgxIDE3NSAxMjVTMTYzLjgxIDEwMCAxNTAgMTAwWk0xNTAgMTM3LjVDMTQzLjA5IDEzNy41IDEzNy41IDEzMS45MSAxMzcuNSAxMjVTMTQzLjA5IDExMi41IDE1MCAxMTIuNVMxNjIuNSAxMTguMDkgMTYyLjUgMTI1UzE1Ni45MSAxMzcuNSAxNTAgMTM3LjVaIiBmaWxsPSIjOUM5QzlDIi8+CjxwYXRoIGQ9Ik0yMDAgMTc1SDEwMEw4NyAyMDBIMjEzTDIwMCAxNzVaIiBmaWxsPSIjOUM5QzlDIi8+Cjwvc3ZnPg=='
                  }}
                />
              </div>

              <div className="p-4">
                {celebrityName && (
                  <div className="mb-2">
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">
                      {celebrityName}
                    </span>
                  </div>
                )}

                <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                  {image.image_description || 'No description available'}
                </p>

                {image.additional_context && (
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer hover:text-gray-800 font-medium">
                      Additional Context
                    </summary>
                    <p className="mt-2 leading-relaxed">
                      {image.additional_context}
                    </p>
                  </details>
                )}

                <div className="mt-3 text-xs text-gray-500">
                  {new Date(image.created_datetime_utc).toLocaleDateString()}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {images.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          No public images found.
        </div>
      )}
    </div>
  )
}