'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UploadState {
  step: 'idle' | 'uploading' | 'generating' | 'complete' | 'error'
  progress: number
  message: string
  error?: string
  generatedCaptions?: any[]
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({
    step: 'idle',
    progress: 0,
    message: ''
  })
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  // Check auth on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
    }
    checkAuth()
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
    if (!allowedTypes.includes(selectedFile.type)) {
      setUploadState({
        step: 'error',
        progress: 0,
        message: '',
        error: 'Please select a valid image file (JPEG, PNG, WebP, GIF, or HEIC)'
      })
      return
    }

    setFile(selectedFile)
    setUploadState({ step: 'idle', progress: 0, message: '' })
  }

  const uploadAndGenerateCaptions = async () => {
    if (!file || !user) return

    try {
      setUploadState({ step: 'uploading', progress: 10, message: 'Getting upload URL...' })

      // Get JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      // Step 1: Generate presigned URL
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          contentType: file.type
        })
      })

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { presignedUrl, cdnUrl } = await presignedResponse.json()

      setUploadState({ step: 'uploading', progress: 30, message: 'Uploading image...' })

      // Step 2: Upload image to presigned URL
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      setUploadState({ step: 'uploading', progress: 50, message: 'Registering image...' })

      // Step 3: Register image URL
      const registerResponse = await fetch('/api/upload/register-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          imageUrl: cdnUrl
        })
      })

      if (!registerResponse.ok) {
        throw new Error('Failed to register image')
      }

      const { imageId } = await registerResponse.json()

      setUploadState({ step: 'generating', progress: 70, message: 'Generating captions...' })

      // Step 4: Generate captions
      const captionsResponse = await fetch('/api/upload/generate-captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          imageId
        })
      })

      if (!captionsResponse.ok) {
        throw new Error('Failed to generate captions')
      }

      const generatedCaptions = await captionsResponse.json()

      setUploadState({
        step: 'complete',
        progress: 100,
        message: 'Captions generated successfully!',
        generatedCaptions
      })

    } catch (error) {
      console.error('Upload error:', error)
      setUploadState({
        step: 'error',
        progress: 0,
        message: '',
        error: error instanceof Error ? error.message : 'An error occurred during upload'
      })
    }
  }

  const resetUpload = () => {
    setFile(null)
    setUploadState({ step: 'idle', progress: 0, message: '' })
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Upload & Generate Captions</h1>
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <Link
                  href="/captions"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Vote on Captions
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">📸 Upload Your Image</h2>
          <p className="text-blue-800 mb-3">
            Upload an image and our AI will generate funny captions for it! Supported formats: JPEG, PNG, WebP, GIF, HEIC.
          </p>
        </div>

        {/* Upload Interface */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* File Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Image
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
              onChange={handleFileSelect}
              disabled={uploadState.step === 'uploading' || uploadState.step === 'generating'}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          {/* File Preview */}
          {file && (
            <div className="mb-6">
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📷</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {(uploadState.step === 'uploading' || uploadState.step === 'generating') && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{uploadState.message}</span>
                <span>{uploadState.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {uploadState.step === 'error' && uploadState.error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-red-400">
                  <span className="text-lg">❌</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{uploadState.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Display */}
          {uploadState.step === 'complete' && uploadState.generatedCaptions && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="text-green-400">
                    <span className="text-lg">✅</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{uploadState.message}</p>
                  </div>
                </div>
              </div>

              {/* Generated Captions */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Generated Captions:</h3>
                {uploadState.generatedCaptions.map((caption: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-800">"{caption.content || caption.text || 'Caption generated'}"</p>
                    {caption.humor_flavor && (
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                        {caption.humor_flavor}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={resetUpload}
              disabled={uploadState.step === 'uploading' || uploadState.step === 'generating'}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              onClick={uploadAndGenerateCaptions}
              disabled={!file || uploadState.step === 'uploading' || uploadState.step === 'generating'}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadState.step === 'uploading' ? 'Uploading...' :
               uploadState.step === 'generating' ? 'Generating...' :
               'Upload & Generate Captions'}
            </button>
          </div>
        </div>

        {/* Additional Actions */}
        {uploadState.step === 'complete' && (
          <div className="mt-6 text-center">
            <Link
              href="/captions"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              🗳️ Vote on All Captions
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}