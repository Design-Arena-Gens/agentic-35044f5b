import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

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

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function loadSchedules(): Promise<ScheduledUpload[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(STORAGE_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveSchedules(schedules: ScheduledUpload[]) {
  await ensureDataDir()
  await fs.writeFile(STORAGE_FILE, JSON.stringify(schedules, null, 2))
}

export async function POST(request: NextRequest) {
  const { videoId, scheduledTime, title, description } = await request.json()

  if (!videoId || !scheduledTime || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const schedules = await loadSchedules()

  const newUpload: ScheduledUpload = {
    id: Date.now().toString(),
    videoId,
    videoName: title,
    scheduledTime,
    title,
    description: description || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  schedules.push(newUpload)
  await saveSchedules(schedules)

  return NextResponse.json({ success: true, upload: newUpload })
}
