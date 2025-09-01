'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  TrendingUp, 
  Heart, 
  Brain, 
  Star,
  Calendar,
  Filter,
  ChevronDown,
  BarChart3
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Insight {
  id: string
  type: string
  category: string
  title: string
  description: string
  confidence: number
  createdAt: string
  child: {
    name: string
  }
  conversation?: {
    title: string
  }
}

interface Child {
  id: string
  name: string
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [insightsRes, childrenRes] = await Promise.all([
        fetch('/api/insights'),
        fetch('/api/children')
      ])

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json()
        setInsights(insightsData.insights || []) // Handle undefined insights
      }

      if (childrenRes.ok) {
        const childrenData = await childrenRes.json()
        setChildren(childrenData || []) // API now returns array directly
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setInsights([]) // Ensure arrays are never undefined
      setChildren([])
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

  const filteredInsights = (insights || []).filter(insight => {
    if (selectedChild !== 'all' && insight.child.name !== selectedChild) return false
    if (selectedType !== 'all' && insight.type !== selectedType) return false
    return true
  })

  const insightStats = {
    total: (insights || []).length,
    curiosity: (insights || []).filter(i => i.type === 'CURIOSITY_PATTERN').length,
    cognitive: (insights || []).filter(i => i.type === 'COGNITIVE_STRENGTH').length,
    interests: (insights || []).filter(i => i.type === 'INTEREST_SIGNAL').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded-md w-48 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded-md w-96"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
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
            Child Insights
          </h1>
          <p className="text-neutral-600 mt-1">
            Discover patterns in your children's curiosity, interests, and cognitive development
          </p>
        </div>
        
        {selectedChild !== 'all' && (
          <Button 
            onClick={() => window.location.href = `/dashboard/insights/visualize?childId=${selectedChild}`}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Visualize Insights
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Star className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insightStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Curiosity Patterns</CardTitle>
            <Sparkles className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insightStats.curiosity}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cognitive Strengths</CardTitle>
            <Brain className="h-4 w-4 text-secondary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insightStats.cognitive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interest Signals</CardTitle>
            <Heart className="h-4 w-4 text-warm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insightStats.interests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-neutral-600" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="text-sm border border-neutral-200 rounded-md px-3 py-1"
            >
              <option value="all">All Children</option>
              {children && children.map(child => (
                <option key={child.id} value={child.name}>{child.name}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-sm border border-neutral-200 rounded-md px-3 py-1"
            >
              <option value="all">All Types</option>
              <option value="CURIOSITY_PATTERN">Curiosity Patterns</option>
              <option value="COGNITIVE_STRENGTH">Cognitive Strengths</option>
              <option value="INTEREST_SIGNAL">Interest Signals</option>
              <option value="LEARNING_STYLE">Learning Styles</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      {filteredInsights.length > 0 ? (
        <div className="space-y-4">
          {filteredInsights.map(insight => (
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
                        <span>{insight.child.name}</span>
                        <span>•</span>
                        <span className="capitalize">{insight.category}</span>
                        <span>•</span>
                        <span className={getConfidenceColor(insight.confidence)}>
                          {getConfidenceLabel(insight.confidence)} confidence
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500 text-right">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatRelativeTime(new Date(insight.createdAt))}
                    </div>
                    {insight.conversation && (
                      <div className="text-xs mt-1">
                        from "{insight.conversation.title}"
                      </div>
                    )}
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
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No insights yet
              </h3>
              <p className="text-neutral-600 max-w-md mx-auto">
                Start recording conversations to discover your children's unique curiosity patterns and interests.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
