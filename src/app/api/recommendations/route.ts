import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { refreshRecommendations } from '@/lib/recommendations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
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

    // Get active recommendations
    const recommendations = await prisma.recommendation.findMany({
      where: {
        childId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ recommendations })

  } catch (error) {
    console.error('Get recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
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

    const { childId } = await request.json()

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
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

    // Generate new recommendations
    const recommendations = await refreshRecommendations(childId)

    return NextResponse.json({ 
      success: true,
      recommendations: recommendations.length 
    })

  } catch (error) {
    console.error('Generate recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
