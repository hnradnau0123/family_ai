import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Children API called')
    
    const session = await getServerSession(authOptions)
    console.log('👤 Session user ID:', session?.user?.id)
    console.log('📧 Session user email:', session?.user?.email)

    if (!session?.user?.id) {
      console.log('❌ No session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get children from database
    const children = await prisma.child.findMany({
      where: {
        parentId: session.user.id
      },
      include: {
        _count: {
          select: {
            conversations: true,
            insights: true,
            recommendations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('👶 Found', children.length, 'children for user', session.user.id)
    console.log('📊 Children:', children.map(c => ({ id: c.id, name: c.name })))

    return NextResponse.json(children)

  } catch (error) {
    console.error('Get children error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, birthDate } = await request.json()

    if (!name || !birthDate) {
      return NextResponse.json(
        { error: 'Name and birth date are required' },
        { status: 400 }
      )
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      // Create user if not exists (should not happen with proper auth flow)
      await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email || 'unknown@example.com',
          name: session.user.name || 'Unknown User'
        }
      })
    }

    // Create child in database
    const child = await prisma.child.create({
      data: {
        name,
        birthDate: new Date(birthDate),
        parentId: session.user.id
      }
    })

    return NextResponse.json({ child })

  } catch (error) {
    console.error('Create child error:', error)
    return NextResponse.json(
      { error: 'Failed to create child profile' },
      { status: 500 }
    )
  }
}