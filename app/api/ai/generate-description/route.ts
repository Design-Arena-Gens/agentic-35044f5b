import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  const { title } = await request.json()

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a YouTube video description writer. Create engaging, SEO-friendly descriptions for videos based on their titles. Include relevant hashtags and calls to action. Keep it under 200 words.'
        },
        {
          role: 'user',
          content: `Write a YouTube video description for a video titled: "${title}"`
        }
      ],
      max_tokens: 300,
    })

    const description = completion.choices[0]?.message?.content || ''

    return NextResponse.json({ description })
  } catch (error) {
    console.error('Failed to generate description:', error)
    return NextResponse.json({
      description: `${title}\n\nWatch this amazing video! Don't forget to like, comment, and subscribe for more content!\n\n#video #content #youtube`
    })
  }
}
