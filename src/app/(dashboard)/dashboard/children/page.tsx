'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Users, 
  MessageCircle, 
  Sparkles, 
  Calendar,
  TrendingUp,
  ChevronRight
} from 'lucide-react'
import { calculateAge, formatDate } from '@/lib/utils'

interface Child {
  id: string
  name: string
  birthDate: string
  createdAt: string
  _count: {
    conversations: number
    insights: number
    recommendations: number
  }
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/children')
      if (response.ok) {
        const data = await response.json()
        setChildren(data || []) // API now returns array directly
      }
    } catch (error) {
      console.error('Error fetching children:', error)
      setChildren([]) // Ensure children is always an array
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded-md w-48 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded-md w-96"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-neutral-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 font-display">
            Your Children
          </h1>
          <p className="text-neutral-600 mt-1">
            Manage profiles and track each child's unique development journey
          </p>
        </div>
        <Link href="/dashboard/children/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </Link>
      </div>

      {/* Children Grid */}
      {children && children.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => {
            const age = calculateAge(new Date(child.birthDate))
            
            return (
              <Card key={child.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {child.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{child.name}</CardTitle>
                        <CardDescription>
                          {age} year{age !== 1 ? 's' : ''} old
                        </CardDescription>
                      </div>
                    </div>
                    <Link href={`/dashboard/children/${child.id}`}>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-secondary-100 rounded-lg mx-auto mb-1">
                        <MessageCircle className="h-4 w-4 text-secondary-600" />
                      </div>
                      <div className="text-lg font-semibold text-neutral-900">
                        {child._count.conversations}
                      </div>
                      <div className="text-xs text-neutral-600">
                        Conversations
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-warm-100 rounded-lg mx-auto mb-1">
                        <Sparkles className="h-4 w-4 text-warm-600" />
                      </div>
                      <div className="text-lg font-semibold text-neutral-900">
                        {child._count.insights}
                      </div>
                      <div className="text-xs text-neutral-600">
                        Insights
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-lg mx-auto mb-1">
                        <TrendingUp className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="text-lg font-semibold text-neutral-900">
                        {child._count.recommendations}
                      </div>
                      <div className="text-xs text-neutral-600">
                        Activities
                      </div>
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Calendar className="h-4 w-4" />
                    Born {formatDate(new Date(child.birthDate))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/dashboard/conversations/new?childId=${child.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Record
                      </Button>
                    </Link>
                    <Link href={`/dashboard/children/${child.id}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <Card className="py-12">
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No children profiles yet
              </h3>
              <p className="text-neutral-600 max-w-md mx-auto">
                Create your first child profile to start capturing conversations and discovering their unique interests and strengths.
              </p>
            </div>
            <Link href="/dashboard/children/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Child
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
