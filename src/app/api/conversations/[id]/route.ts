import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: id,
        child: {
          parentId: (session?.user as any)?.id
        }
      },
      include: {
        child: {
          select: {
            name: true,
            birthDate: true
          }
        },
        insights: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Calculate child age at time of conversation
    const childAge = Math.floor(
      (conversation.conversationDate.getTime() - conversation.child.birthDate.getTime()) / 
      (365.25 * 24 * 60 * 60 * 1000)
    )

    // Format for frontend
    const conversationDetails = {
      id: conversation.id,
      title: conversation.title || 'Untitled Conversation',
      childName: conversation.child.name,
      childAge,
      transcription: conversation.transcription,
      duration: conversation.duration || 0,
      processed: conversation.processed,
      conversationDate: conversation.conversationDate.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
      insights: conversation.insights.map(insight => ({
        id: insight.id,
        type: insight.type,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence,
        metadata: insight.metadata ? JSON.parse(insight.metadata) : null
      }))
    }

    return NextResponse.json(conversationDetails)

  } catch (error) {
    console.error('Get conversation details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation details' },
      { status: 500 }
    )
  }
}
