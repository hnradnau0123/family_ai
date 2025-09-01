'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  Users,
  Calendar,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Brain,
  Heart,
  Star,
  Plus,
  Play,
  Clock,
  BookOpen,
  Gamepad2,
  Music
} from 'lucide-react'
import { calculateAge, formatDate, formatRelativeTime } from '@/lib/utils'

interface ChildProfile {
  id: string
  name: string
  birthDate: string
  age: number
  createdAt: string
  stats: {
    conversations: number
    insights: number
    recommendations: number
  }
  recentConversations: Array<{
    id: string
    title: string
    duration: number
    createdAt: string
  }>
  topInsights: Array<{
    id: string
    type: string
    category: string
    title: string
    confidence: number
  }>
  recommendations: Array<{
    id: string
    type: string
    title: string
    description: string
    category: string
  }>
}

export default function ChildProfilePage() {
  const params = useParams()
  const [profile, setProfile] = useState<ChildProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchChildProfile(params.id as string)
    }
  }, [params.id])

  const fetchChildProfile = async (id: string) => {
    try {
      const response = await fetch(`/api/children/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch child profile')
      }
      
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching child profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'CURIOSITY_PATTERN':
        return <Sparkles className="h-4 w-4" />
      case 'COGNITIVE_STRENGTH':
        return <Brain className="h-4 w-4" />
      case 'INTEREST_SIGNAL':
        return <Heart className="h-4 w-4" />
      case 'LEARNING_STYLE':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'CURIOSITY_PATTERN':
        return 'bg-primary-100 text-primary-700 border-primary-200'
      case 'COGNITIVE_STRENGTH':
        return 'bg-secondary-100 text-secondary-700 border-secondary-200'
      case 'INTEREST_SIGNAL':
        return 'bg-warm-100 text-warm-700 border-warm-200'
      case 'LEARNING_STYLE':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'BOOK':
        return <BookOpen className="h-4 w-4" />
      case 'GAME':
        return <Gamepad2 className="h-4 w-4" />
      case 'CLASS':
        return <Music className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded-md w-64 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded-md w-96"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-neutral-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/children" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Children
        </Link>
        
        <Card className="py-12">
          <CardContent className="text-center">
            <Users className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Child profile not found
            </h3>
            <p className="text-neutral-600">
              The child profile you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link 
          href="/dashboard/children"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Children
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 font-display">
                {profile.name}
              </h1>
              <div className="flex items-center gap-4 text-neutral-600 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {profile.age} years old
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Profile created {formatRelativeTime(new Date(profile.createdAt))}
                </div>
              </div>
            </div>
          </div>
          
          <Link href={`/dashboard/conversations/new?childId=${profile.id}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Conversation
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.conversations}</div>
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
            <div className="text-2xl font-bold">{profile.stats.insights}</div>
            <p className="text-xs text-neutral-600">
              Discoveries made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <Star className="h-4 w-4 text-secondary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.recommendations}</div>
            <p className="text-xs text-neutral-600">
              Personalized suggestions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations & Top Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>
              Latest captured moments with {profile.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.recentConversations.map(conversation => (
              <div key={conversation.id} className="flex items-center justify-between p-3 rounded-lg border border-warm-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{conversation.title}</p>
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <Clock className="h-3 w-3" />
                      {Math.floor(conversation.duration / 60)}m {conversation.duration % 60}s
                      <span>•</span>
                      {formatRelativeTime(new Date(conversation.createdAt))}
                    </div>
                  </div>
                </div>
                <Link href={`/dashboard/conversations/${conversation.id}`}>
                  <Button variant="ghost" size="sm">
                    <Play className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ))}
            <Link href="/dashboard/conversations">
              <Button variant="ghost" className="w-full text-sm">
                View all conversations
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Top Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>
                  What we've discovered about {profile.name}
                </CardDescription>
              </div>
              <Link href={`/dashboard/insights/visualize?childId=${profile.id}`}>
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Visualize
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.topInsights.map(insight => (
              <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg border border-warm-200">
                <div className={`p-2 rounded-lg border ${getInsightColor(insight.type)}`}>
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{insight.title}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <span className="capitalize">{insight.category}</span>
                    <span>•</span>
                    <span className="text-green-600">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/dashboard/insights">
              <Button variant="ghost" className="w-full text-sm">
                View all insights
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Curiosity Playlist</CardTitle>
          <CardDescription>
            Personalized recommendations based on {profile.name}'s interests and strengths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {profile.recommendations.map(rec => (
              <div key={rec.id} className="flex items-start gap-3 p-4 rounded-lg border border-warm-200 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                  {getRecommendationIcon(rec.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{rec.title}</h3>
                    <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                      {rec.type.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/dashboard/playlist">
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Full Curiosity Playlist
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Child Details */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-neutral-700">Full Name</label>
              <p className="text-neutral-900">{profile.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Age</label>
              <p className="text-neutral-900">{profile.age} years old</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Birth Date</label>
              <p className="text-neutral-900">{formatDate(new Date(profile.birthDate))}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Profile Created</label>
              <p className="text-neutral-900">{formatDate(new Date(profile.createdAt))}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
