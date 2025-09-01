'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  MessageCircle, 
  Sparkles, 
  Plus, 
  TrendingUp,
  Clock,
  Heart,
  ChevronRight,
  ListMusic
} from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
  childrenCount: number
  totalConversations: number
  totalInsights: number
  recentConversations: Array<{
    id: string
    childName: string
    title: string
    createdAt: string
  }>
  todayStarter: string
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded-md w-64 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded-md w-96"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900 font-display">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-neutral-600">
          Ready to discover something new about your little ones today?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
            <Users className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.childrenCount || 0}</div>
            <p className="text-xs text-neutral-600">
              Active profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-secondary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalConversations || 0}</div>
            <p className="text-xs text-neutral-600">
              Captured moments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights</CardTitle>
            <Sparkles className="h-4 w-4 text-warm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalInsights || 0}</div>
            <p className="text-xs text-neutral-600">
              Discoveries made
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Conversation Starter */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            <CardTitle className="text-white">Today's Conversation Starter</CardTitle>
          </div>
          <CardDescription className="text-primary-100">
            A personalized prompt to spark curiosity during your next family moment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg font-medium leading-relaxed">
            {dashboardData?.todayStarter || "What do you think would happen if we could talk to animals?"}
          </div>
          <Link href="/dashboard/conversations/new">
            <Button variant="secondary" size="sm" className="bg-white text-primary-600 hover:bg-primary-50">
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to help you engage with your children
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/children/new">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Child Profile
              </Button>
            </Link>
            <Link href="/dashboard/conversations/new">
              <Button className="w-full justify-start" variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Record Conversation
              </Button>
            </Link>
            <Link href="/dashboard/insights">
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Insights
              </Button>
            </Link>
            <Link href="/dashboard/playlist">
              <Button className="w-full justify-start" variant="outline">
                <ListMusic className="h-4 w-4 mr-2" />
                Suggestion Playlist
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>
              Your latest captured moments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentConversations?.length ? (
              <div className="space-y-3">
                {dashboardData.recentConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-warm-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{conversation.title}</p>
                        <p className="text-xs text-neutral-600">
                          with {conversation.childName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Clock className="h-3 w-3" />
                      {new Date(conversation.createdAt).toLocaleDateString()}
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/conversations">
                  <Button variant="ghost" className="w-full text-sm">
                    View all conversations
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageCircle className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600 mb-3">
                  No conversations yet. Start capturing moments!
                </p>
                <Link href="/dashboard/conversations/new">
                  <Button size="sm">
                    Record First Conversation
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
