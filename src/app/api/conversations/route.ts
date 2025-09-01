import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get conversations from database
    const conversations = await prisma.conversation.findMany({
      where: {
        child: {
          parentId: (session?.user as any)?.id
        }
      },
      include: {
        child: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            insights: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format for frontend
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      title: conv.title || 'Untitled Conversation',
      childName: conv.child.name,
      duration: conv.duration || 0,
      insightCount: conv._count.insights,
      processed: conv.processed,
      createdAt: conv.createdAt.toISOString()
    }))

    return NextResponse.json({ conversations: formattedConversations })

  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to parse as JSON first (for new conversation modes), then FormData (for traditional)
    let childId: string
    let title: string
    let durationStr: string
    let audioFile: File | null = null
    let transcription: string = ''
    let isTextMode = false

    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      // Handle JSON requests from interactive/realtime modes
      const jsonData = await request.json()
      childId = jsonData.childId
      title = jsonData.title || 'AI Conversation'
      durationStr = jsonData.duration?.toString() || '0'
      transcription = jsonData.transcription || ''
      isTextMode = true
    } else {
      // Handle FormData requests from traditional recording
      const formData = await request.formData()
      childId = formData.get('childId') as string
      title = formData.get('title') as string
      durationStr = formData.get('duration') as string
      audioFile = formData.get('audio') as File
    }
    
    if (!childId || (!audioFile && !isTextMode)) {
      return NextResponse.json(
        { error: 'Child ID and audio file or transcription are required' },
        { status: 400 }
      )
    }

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: (session?.user as any)?.id
      }
    })

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      )
    }

    // Process audio or use existing transcription
    let duration = 0
    
    if (!isTextMode && audioFile) {
      // Traditional mode: process audio file with OpenAI Whisper
      try {
        // Convert File to Buffer for OpenAI
        const bytes = await audioFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Import transcribeAudio function
        const { transcribeAudio } = await import('@/lib/openai')
        
        // Transcribe audio using OpenAI Whisper
        transcription = await transcribeAudio(buffer)
        
        // Use duration from frontend (convert from string)
        duration = durationStr ? parseInt(durationStr) : Math.round(buffer.length / 16000)
        
      } catch (transcriptionError) {
        console.error('Transcription failed:', transcriptionError)
        return NextResponse.json(
          { error: 'Failed to transcribe audio' },
          { status: 500 }
        )
      }
    } else {
      // Interactive/Realtime mode: use provided transcription
      duration = durationStr ? parseInt(durationStr) : 60 // Default 1 minute if not provided
    }

    // Create conversation in database
    const conversation = await prisma.conversation.create({
      data: {
        childId,
        title: title || 'Untitled Conversation',
        transcription,
        duration,
        processed: false
      }
    })

    // Analyze conversation with OpenAI in background
    try {
      const childAge = Math.floor((Date.now() - child.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      const { analyzeConversation } = await import('@/lib/openai')
      const analysis = await analyzeConversation(transcription, child.name, childAge)

      // Save insights to database
      for (const insight of analysis.insights) {
        await prisma.insight.create({
          data: {
            childId,
            conversationId: conversation.id,
            type: insight.type,
            category: insight.category,
            title: insight.title,
            description: insight.description,
            confidence: insight.confidence,
            metadata: JSON.stringify({
              curiosityIndicators: analysis.curiosityIndicators,
              cognitiveStrengths: analysis.cognitiveStrengths,
              executiveFunctions: analysis.executiveFunctions,
              developmentalAnalysis: analysis.developmentalAnalysis,
              academicBasis: insight.academicBasis,
              parentRecommendations: insight.parentRecommendations
            })
          }
        })
      }

      // Mark conversation as processed
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { processed: true }
      })

    } catch (aiError) {
      console.error('AI analysis failed:', aiError)
      // Don't fail the whole request if AI analysis fails
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        transcription: conversation.transcription,
        createdAt: conversation.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Conversation API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process conversation',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : '') : undefined
      },
      { status: 500 }
    )
  }
}