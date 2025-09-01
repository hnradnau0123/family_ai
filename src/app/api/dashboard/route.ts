import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateConversationStarter } from '@/lib/openai'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get dashboard data from database
    const [childrenCount, totalConversations, totalInsights, recentConversations] = await Promise.all([
      // Count children
      prisma.child.count({
        where: { parentId: (session?.user as any)?.id }
      }),
      
      // Count conversations
      prisma.conversation.count({
        where: {
          child: { parentId: (session?.user as any)?.id }
        }
      }),
      
      // Count insights
      prisma.insight.count({
        where: {
          child: { parentId: (session?.user as any)?.id }
        }
      }),
      
      // Get recent conversations
      prisma.conversation.findMany({
        where: {
          child: { parentId: (session?.user as any)?.id }
        },
        include: {
          child: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    // Get recent insights for conversation starter
    const recentInsights = await prisma.insight.findMany({
      where: {
        child: { parentId: (session?.user as any)?.id }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    // Generate personalized conversation starter
    let todayStarter = "What do you think would happen if we could talk to animals?"
    try {
      if (recentInsights.length > 0) {
        const insightCategories = recentInsights.map(i => i.category)
        todayStarter = await generateConversationStarter(
          'your child', // Generic since we might have multiple children
          6, // Average age
          insightCategories
        )
      }
    } catch (error) {
      console.error('Failed to generate conversation starter:', error)
    }

    const dashboardData = {
      childrenCount,
      totalConversations,
      totalInsights,
      recentConversations: recentConversations.map(conv => ({
        id: conv.id,
        title: conv.title || 'Untitled Conversation',
        childName: conv.child.name,
        createdAt: conv.createdAt.toISOString()
      })),
      todayStarter
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}