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

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const child = await prisma.child.findFirst({
      where: {
        id: id,
        parentId: (session?.user as any)?.id
      },
      include: {
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            duration: true,
            createdAt: true
          }
        },
        insights: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        recommendations: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 8
        },
        _count: {
          select: {
            conversations: true,
            insights: true,
            recommendations: true
          }
        }
      }
    })

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      )
    }

    // Calculate age
    const age = Math.floor(
      (Date.now() - child.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )

    // Format for frontend
    const childProfile = {
      id: child.id,
      name: child.name,
      birthDate: child.birthDate.toISOString(),
      age,
      createdAt: child.createdAt.toISOString(),
      stats: {
        conversations: child._count.conversations,
        insights: child._count.insights,
        recommendations: child._count.recommendations
      },
      recentConversations: child.conversations.map(conv => ({
        id: conv.id,
        title: conv.title || 'Untitled Conversation',
        duration: conv.duration || 0,
        createdAt: conv.createdAt.toISOString()
      })),
      topInsights: child.insights.map(insight => ({
        id: insight.id,
        type: insight.type,
        category: insight.category,
        title: insight.title,
        confidence: insight.confidence
      })),
      recommendations: child.recommendations.map(rec => ({
        id: rec.id,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        category: rec.category
      }))
    }

    return NextResponse.json(childProfile)

  } catch (error) {
    console.error('Get child profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch child profile' },
      { status: 500 }
    )
  }
}
