'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  Play,
  Pause,
  Download,
  Clock,
  Users,
  Calendar,
  Sparkles,
  MessageCircle,
  Brain,
  Heart,
  TrendingUp,
  Volume2
} from 'lucide-react'
import { formatRelativeTime, formatDuration } from '@/lib/utils'

interface ConversationDetail {
  id: string
  title: string
  childName: string
  childAge: number
  duration: number
  transcription: string
  audioUrl?: string
  processed: boolean
  createdAt: string
  insights: Array<{
    id: string
    type: string
    category: string
    title: string
    description: string
    confidence: number
  }>
}

export default function ConversationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [retryingAnalysis, setRetryingAnalysis] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchConversation(params.id as string)
    }
  }, [params.id])

  const fetchConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation')
      }
      
      const data = await response.json()
      
      // Use real data if it exists, otherwise show fallback demo conversation
      if (!data || !data.transcription || data.transcription.trim() === '') {
        const fallbackConversation: ConversationDetail = {
          id,
          title: 'Demo Conversation',
          childName: 'Demo Child',
          childAge: 6,
          duration: 180,
          transcription: `Parent: What do you think about when you look up at the stars?

Child: I think about how big they are! And I wonder if there are other kids on other planets looking at our sun.

Parent: That's a fascinating thought! What do you think those kids might be like?

Child: Maybe they have purple skin and can fly! And maybe they eat rainbow food. Do you think they have pets?

Parent: I don't know, what do you think their pets might be like?

Child: Maybe they have flying cats! Or dogs that can change colors. Oh! And maybe their pets can talk too!

Parent: You have such creative ideas. What would you want to ask an alien child if you met one?

Child: I would ask them what games they play! And if they have playgrounds. And if they know how to make friends.

Parent: Those are wonderful questions. Why do you think making friends is important?

Child: Because friends make everything more fun! Even scary things become less scary when you have friends.`,
        audioUrl: undefined,
        processed: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        insights: [
          {
            id: '1',
            type: 'CURIOSITY_PATTERN',
            category: 'Scientific Wonder',
            title: 'Strong Astronomical Curiosity',
            description: 'Shows deep fascination with space and asks speculative "what if" questions about life beyond Earth. Demonstrates ability to think beyond immediate environment.',
            confidence: 0.85
          },
          {
            id: '2',
            type: 'COGNITIVE_STRENGTH',
            category: 'Creative Imagination',
            title: 'Vivid Creative Visualization',
            description: 'Demonstrates exceptional ability to create detailed imaginary scenarios (purple aliens, flying cats, color-changing dogs). Shows strong visual-spatial thinking.',
            confidence: 0.92
          },
          {
            id: '3',
            type: 'SOCIAL_PATTERN',
            category: 'Friendship Values',
            title: 'Deep Understanding of Social Connection',
            description: 'Naturally connects with ideas about friendship and social bonds, even in fantastical contexts. Shows emotional intelligence about fear and comfort.',
            confidence: 0.78
          }
        ]
      }

        setConversation(fallbackConversation)
      } else {
        setConversation(data)
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const retryAnalysis = async () => {
    if (!conversation) return
    
    setRetryingAnalysis(true)
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/reprocess`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Refresh the conversation data
        await fetchConversation(conversation.id)
        alert('Analysis completed successfully! Your insights are now available.')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to retry analysis')
      }
    } catch (error) {
      console.error('Error retrying analysis:', error)
      alert('Failed to retry analysis')
    } finally {
      setRetryingAnalysis(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'CURIOSITY_PATTERN':
        return <Sparkles className="h-4 w-4" />
      case 'COGNITIVE_STRENGTH':
        return <Brain className="h-4 w-4" />
      case 'SOCIAL_PATTERN':
        return <Heart className="h-4 w-4" />
      case 'LEARNING_STYLE':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'CURIOSITY_PATTERN':
        return 'bg-primary-100 text-primary-700 border-primary-200'
      case 'COGNITIVE_STRENGTH':
        return 'bg-secondary-100 text-secondary-700 border-secondary-200'
      case 'SOCIAL_PATTERN':
        return 'bg-warm-100 text-warm-700 border-warm-200'
      case 'LEARNING_STYLE':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-amber-600'
    return 'text-neutral-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded-md w-64 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded-md w-96"></div>
        </div>
        <div className="h-96 bg-neutral-200 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/conversations" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Conversations
        </Link>
        
        <Card className="py-12">
          <CardContent className="text-center">
            <MessageCircle className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Conversation not found
            </h3>
            <p className="text-neutral-600">
              The conversation you're looking for doesn't exist or has been removed.
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
          href="/dashboard/conversations"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Conversations
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 font-display">
            {conversation.title}
          </h1>
          <div className="flex items-center gap-4 text-neutral-600 mt-2">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {conversation.childName} ({conversation.childAge} years old)
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(conversation.duration)}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatRelativeTime(new Date(conversation.createdAt))}
            </div>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Recording
          </CardTitle>
          <CardDescription>
            Listen to the original conversation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!conversation.audioUrl}
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <div className="flex-1 h-2 bg-neutral-200 rounded-full">
              <div className="h-full bg-primary-500 rounded-full w-1/3"></div>
            </div>
            
            <span className="text-sm text-neutral-600">
              1:02 / {formatDuration(conversation.duration)}
            </span>
            
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          {!conversation.audioUrl && (
            <p className="text-sm text-neutral-500 mt-2">
              Audio file not available for this demo conversation
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transcription */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Transcript</CardTitle>
          <CardDescription>
            Automatically generated from the audio recording
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-neutral max-w-none">
            <div className="whitespace-pre-line text-neutral-700 leading-relaxed">
              {conversation.transcription}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900 font-display">
            AI Insights
          </h2>
          {conversation.processed && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <Sparkles className="h-4 w-4" />
              Analysis Complete
            </div>
          )}
        </div>

        {conversation.insights.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {conversation.insights.map(insight => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${getInsightColor(insight.type)}`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{insight.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <span className="capitalize">{insight.category}</span>
                          <span>•</span>
                          <span className={getConfidenceColor(insight.confidence)}>
                            {getConfidenceLabel(insight.confidence)} confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-neutral-700 leading-relaxed">
                    {insight.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <Sparkles className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No insights yet
              </h3>
              <p className="text-neutral-600 mb-4">
                {conversation.processed 
                  ? 'No insights were generated for this conversation.'
                  : 'This conversation is still being processed. Check back soon!'}
              </p>
              {!conversation.processed && (
                <Button 
                  onClick={retryAnalysis}
                  disabled={retryingAnalysis}
                  variant="outline"
                  className="mt-4"
                >
                  {retryingAnalysis ? 'Analyzing...' : 'Retry Analysis'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/dashboard/children/${conversation.childName.toLowerCase().replace(/\s+/g, '-')}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                View {conversation.childName}'s Profile
              </Button>
            </Link>
            <Link href="/dashboard/conversations/new" className="flex-1">
              <Button className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Record New Conversation
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
