import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const STORAGE_FILE = path.join(process.cwd(), 'data', 'scheduled-uploads.json')

export async function GET() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf-8')
    const uploads = JSON.parse(data)
    return NextResponse.json({ uploads })
  } catch {
    return NextResponse.json({ uploads: [] })
  }
}
