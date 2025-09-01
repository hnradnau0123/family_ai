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

    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')

    const where = childId ? {
      childId,
      child: { parentId: (session?.user as any)?.id }
    } : {
      child: { parentId: (session?.user as any)?.id }
    }

    const insights = await prisma.insight.findMany({
      where,
      include: {
        child: {
          select: {
            name: true
          }
        },
        conversation: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ insights })

  } catch (error) {
    console.error('Get insights error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}
