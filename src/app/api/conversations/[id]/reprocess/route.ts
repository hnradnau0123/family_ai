import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get conversation and verify ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: id,
        child: {
          parentId: (session?.user as any)?.id
        }
      },
      include: {
        child: true
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Clear existing insights
    await prisma.insight.deleteMany({
      where: {
        conversationId: conversation.id
      }
    })

    // Re-analyze conversation with OpenAI
    try {
      const childAge = Math.floor((Date.now() - conversation.child.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      const { analyzeConversation } = await import('@/lib/openai')
      const analysis = await analyzeConversation(conversation.transcription || '', conversation.child.name, childAge)

      // Save insights to database
      for (const insight of analysis.insights) {
        await prisma.insight.create({
          data: {
            childId: conversation.childId,
            conversationId: conversation.id,
            type: insight.type,
            category: insight.category,
            title: insight.title,
            description: insight.description,
            confidence: insight.confidence,
            metadata: JSON.stringify({
              curiosityIndicators: analysis.curiosityIndicators,
              cognitiveStrengths: analysis.cognitiveStrengths
            })
          }
        })
      }

      // Mark conversation as processed
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { processed: true }
      })

      return NextResponse.json({
        success: true,
        insightCount: analysis.insights.length,
        message: 'Conversation reprocessed successfully'
      })

    } catch (aiError) {
      console.error('AI analysis failed during reprocessing:', aiError)
      return NextResponse.json(
        { error: 'Failed to analyze conversation. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Reprocess conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to reprocess conversation' },
      { status: 500 }
    )
  }
}
