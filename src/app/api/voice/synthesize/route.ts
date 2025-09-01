import { NextRequest, NextResponse } from 'next/server'

interface VoiceRequest {
  text: string
  voiceId?: string
  emotionalTone?: 'encouraging' | 'curious' | 'supportive' | 'playful'
  childAge?: number
}

export async function POST(request: NextRequest) {
  try {
    const { text, emotionalTone, childAge }: VoiceRequest = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    
    // For now, return fallback indicator since ElevenLabs setup needs adjustment
    console.log('🎙️ Voice synthesis requested (fallback mode):', {
      textLength: text.length,
      tone: emotionalTone,
      childAge,
      apiKeyConfigured: !!apiKey
    })

    return NextResponse.json(
      { 
        error: 'ElevenLabs integration temporarily disabled - using Web Speech API fallback', 
        fallback: true 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Voice synthesis error:', error)
    return NextResponse.json(
      { error: 'Speech synthesis failed', fallback: true },
      { status: 500 }
    )
  }
}
