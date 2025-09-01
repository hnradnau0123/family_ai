'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  MessageCircle, 
  Clock, 
  Users, 
  Sparkles,
  Play,
  Calendar,
  Filter
} from 'lucide-react'
import { formatRelativeTime, formatDuration } from '@/lib/utils'

interface Conversation {
  id: string
  title: string
  childName: string
  duration: number
  insightCount: number
  processed: boolean
  createdAt: string
}

interface Child {
  id: string
  name: string
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [conversationsRes, childrenRes] = await Promise.all([
        fetch('/api/conversations'),
        fetch('/api/children')
      ])

      if (conversationsRes.ok) {
        const conversationsData = await conversationsRes.json()
        setConversations(conversationsData.conversations || [])
      }

      if (childrenRes.ok) {
        const childrenData = await childrenRes.json()
        setChildren(childrenData.children || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conversation => {
    if (selectedChild !== 'all' && conversation.childName !== selectedChild) return false
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded-md w-48 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded-md w-96"></div>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-lg animate-pulse"></div>
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
            Conversations
          </h1>
          <p className="text-neutral-600 mt-1">
            Your recorded family moments and discoveries
          </p>
        </div>
        <Link href="/dashboard/conversations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Record New
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
            <p className="text-xs text-neutral-600">
              Captured moments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-secondary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter(c => {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(c.createdAt) > weekAgo
              }).length}
            </div>
            <p className="text-xs text-neutral-600">
              Recent recordings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Sparkles className="h-4 w-4 text-warm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.reduce((sum, c) => sum + c.insightCount, 0)}
            </div>
            <p className="text-xs text-neutral-600">
              Discoveries made
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {children.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-neutral-600" />
                <span className="text-sm font-medium">Filter by child:</span>
              </div>
              
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="text-sm border border-neutral-200 rounded-md px-3 py-1"
              >
                <option value="all">All Children</option>
                {children.map(child => (
                  <option key={child.id} value={child.name}>{child.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <div className="space-y-4">
          {filteredConversations.map(conversation => (
            <Card key={conversation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-primary-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {conversation.title}
                        </h3>
                        {conversation.processed && (
                          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <Sparkles className="h-3 w-3" />
                            Analyzed
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-neutral-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {conversation.childName}
                        </div>
                        
                        {conversation.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(conversation.duration)}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatRelativeTime(new Date(conversation.createdAt))}
                        </div>
                      </div>
                      
                      {conversation.insightCount > 0 && (
                        <div className="text-sm text-neutral-600">
                          {conversation.insightCount} insight{conversation.insightCount !== 1 ? 's' : ''} discovered
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Listen
                    </Button>
                    <Link href={`/dashboard/conversations/${conversation.id}`}>
                      <Button size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="py-12">
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No conversations yet
              </h3>
              <p className="text-neutral-600 max-w-md mx-auto">
                Start recording conversations with your children to discover their unique curiosity patterns and interests.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard/conversations/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record First Conversation
                </Button>
              </Link>
              {children.length === 0 && (
                <Link href="/dashboard/children/new">
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Add Child Profile First
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
