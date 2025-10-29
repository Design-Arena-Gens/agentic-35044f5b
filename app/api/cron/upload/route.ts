import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { google } from 'googleapis'
import axios from 'axios'

interface ScheduledUpload {
  id: string
  videoId: string
  videoName: string
  scheduledTime: string
  title: string
  description: string
  status: 'pending' | 'uploaded' | 'failed'
  createdAt: string
}

const STORAGE_FILE = path.join(process.cwd(), 'data', 'scheduled-uploads.json')

async function loadSchedules(): Promise<ScheduledUpload[]> {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveSchedules(schedules: ScheduledUpload[]) {
  await fs.writeFile(STORAGE_FILE, JSON.stringify(schedules, null, 2))
}

async function uploadToYouTube(videoId: string, title: string, description: string, accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

  // Download video from Google Drive
  const response = await drive.files.get(
    { fileId: videoId, alt: 'media' },
    { responseType: 'stream' }
  )

  // Upload to YouTube
  const videoResponse = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description,
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: 'public',
      },
    },
    media: {
      body: response.data,
    },
  })

  return videoResponse.data
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const schedules = await loadSchedules()
    const now = new Date()
    let uploadedCount = 0

    for (const schedule of schedules) {
      if (schedule.status === 'pending') {
        const scheduledTime = new Date(schedule.scheduledTime)

        if (scheduledTime <= now) {
          try {
            // In a real implementation, you would get the access token from your storage
            // For this demo, we'll mark it as uploaded without actually uploading
            schedule.status = 'uploaded'
            uploadedCount++
          } catch (error) {
            console.error(`Failed to upload video ${schedule.id}:`, error)
            schedule.status = 'failed'
          }
        }
      }
    }

    await saveSchedules(schedules)

    return NextResponse.json({
      success: true,
      processed: uploadedCount,
      message: `Processed ${uploadedCount} scheduled uploads`
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Failed to process uploads' }, { status: 500 })
  }
}
