import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { google } from 'googleapis'

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('google_access_token')

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken.value })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const response = await drive.files.list({
      q: "mimeType contains 'video/'",
      fields: 'files(id, name, mimeType, size, webViewLink)',
      pageSize: 100,
    })

    return NextResponse.json({ videos: response.data.files || [] })
  } catch (error) {
    console.error('Failed to fetch videos:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
