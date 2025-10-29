'use client'

import { useState, useEffect } from 'react'

interface Video {
  id: string
  name: string
  mimeType: string
  size: number
  webViewLink: string
}

interface ScheduledUpload {
  id: string
  videoName: string
  scheduledTime: string
  status: 'pending' | 'uploaded' | 'failed'
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [videos, setVideos] = useState<Video[]>([])
  const [scheduledUploads, setScheduledUploads] = useState<ScheduledUpload[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [uploadTime, setUploadTime] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  useEffect(() => {
    checkAuth()
    loadScheduledUploads()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check')
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
      if (data.authenticated) {
        loadVideos()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const loadVideos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/drive/videos')
      const data = await res.json()
      setVideos(data.videos || [])
    } catch (error) {
      console.error('Failed to load videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadScheduledUploads = async () => {
    try {
      const res = await fetch('/api/schedule/list')
      const data = await res.json()
      setScheduledUploads(data.uploads || [])
    } catch (error) {
      console.error('Failed to load scheduled uploads:', error)
    }
  }

  const handleLogin = () => {
    window.location.href = '/api/auth/login'
  }

  const generateAIDescription = async () => {
    if (!title) {
      alert('Please enter a title first')
      return
    }

    setAiGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      const data = await res.json()
      setDescription(data.description)
    } catch (error) {
      console.error('Failed to generate description:', error)
      alert('Failed to generate AI description')
    } finally {
      setAiGenerating(false)
    }
  }

  const scheduleUpload = async () => {
    if (!selectedVideo || !uploadTime || !title) {
      alert('Please select a video, set upload time, and enter a title')
      return
    }

    try {
      const res = await fetch('/api/schedule/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo,
          scheduledTime: uploadTime,
          title,
          description
        })
      })

      if (res.ok) {
        alert('Upload scheduled successfully!')
        loadScheduledUploads()
        setSelectedVideo(null)
        setUploadTime('')
        setTitle('')
        setDescription('')
      } else {
        const error = await res.json()
        alert(`Failed to schedule upload: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to schedule upload:', error)
      alert('Failed to schedule upload')
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          🤖 YouTube Auto Uploader AI
        </h1>

        {!isAuthenticated ? (
          <div className="text-center">
            <p className="mb-6 text-gray-300">Connect your Google Drive and YouTube accounts to get started</p>
            <button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Connect Google Account
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Videos from Google Drive */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4">📁 Videos from Google Drive</h2>
              {loading ? (
                <p className="text-gray-400">Loading videos...</p>
              ) : videos.length === 0 ? (
                <p className="text-gray-400">No videos found in your Google Drive</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => setSelectedVideo(video.id)}
                      className={`p-3 rounded cursor-pointer transition ${
                        selectedVideo === video.id
                          ? 'bg-blue-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <p className="font-semibold truncate">{video.name}</p>
                      <p className="text-sm text-gray-300">
                        {(video.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule Upload */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4">⏰ Schedule Upload</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Video Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                    placeholder="Enter video title"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none h-24"
                    placeholder="Enter video description"
                  />
                  <button
                    onClick={generateAIDescription}
                    disabled={aiGenerating}
                    className="mt-2 bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-4 rounded transition disabled:opacity-50"
                  >
                    {aiGenerating ? '✨ Generating...' : '✨ Generate AI Description'}
                  </button>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Upload Time *</label>
                  <input
                    type="datetime-local"
                    value={uploadTime}
                    onChange={(e) => setUploadTime(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                  />
                </div>

                <button
                  onClick={scheduleUpload}
                  disabled={!selectedVideo || !uploadTime || !title}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule Upload
                </button>
              </div>
            </div>

            {/* Scheduled Uploads */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl md:col-span-2">
              <h2 className="text-2xl font-bold mb-4">📅 Scheduled Uploads</h2>
              {scheduledUploads.length === 0 ? (
                <p className="text-gray-400">No uploads scheduled</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3">Video</th>
                        <th className="text-left p-3">Scheduled Time</th>
                        <th className="text-left p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduledUploads.map((upload) => (
                        <tr key={upload.id} className="border-b border-gray-700">
                          <td className="p-3">{upload.videoName}</td>
                          <td className="p-3">
                            {new Date(upload.scheduledTime).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-3 py-1 rounded text-sm ${
                                upload.status === 'uploaded'
                                  ? 'bg-green-600'
                                  : upload.status === 'failed'
                                  ? 'bg-red-600'
                                  : 'bg-yellow-600'
                              }`}
                            >
                              {upload.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
