'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Brain,
  TrendingUp,
  Target,
  Heart,
  Zap,
  Eye,
  Users,
  BookOpen,
  Palette,
  Music,
  Gamepad2,
  RefreshCw
} from 'lucide-react'

interface InsightData {
  childId: string
  childName: string
  childAge: number
  totalInsights: number
  personality: {
    curiosity: number      // 0-100
    creativity: number
    social: number
    analytical: number
    emotional: number
    physical: number
  }
  interests: Array<{
    category: string
    strength: number
    examples: string[]
  }>
  development: {
    cognitive: number
    language: number
    social: number
    emotional: number
    physical: number
  }
  learningStyle: {
    visual: number
    auditory: number
    kinesthetic: number
    reading: number
  }
  conversationPatterns: {
    questionAsking: number
    storyTelling: number
    hypothetical: number
    factual: number
  }
  generatedAt: string
}

// Personality Chart Component (MBTI-style)
function PersonalityChart({ personality, childName }: { personality: InsightData['personality'], childName: string }) {
  const traits = [
    { name: 'Curiosity', value: personality.curiosity, color: 'bg-purple-500', icon: Brain },
    { name: 'Creativity', value: personality.creativity, color: 'bg-pink-500', icon: Palette },
    { name: 'Social', value: personality.social, color: 'bg-blue-500', icon: Users },
    { name: 'Analytical', value: personality.analytical, color: 'bg-green-500', icon: Target },
    { name: 'Emotional', value: personality.emotional, color: 'bg-orange-500', icon: Heart },
    { name: 'Physical', value: personality.physical, color: 'bg-red-500', icon: Zap }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          {childName}'s Personality Profile
        </CardTitle>
        <CardDescription>Multi-dimensional personality assessment based on conversation insights</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {traits.map((trait, index) => {
            const Icon = trait.icon
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{trait.name}</span>
                  </div>
                  <Badge variant="outline">{trait.value}%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${trait.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${trait.value}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {getPersonalityDescription(trait.name, trait.value)}
                </p>
              </div>
            )
          })}
        </div>
        
        {/* Personality Type Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
          <h4 className="font-medium text-purple-900 mb-2">Personality Type Summary</h4>
          <p className="text-sm text-purple-800">
            {getPersonalityType(personality)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Interests Radar Chart Component
function InterestsChart({ interests, childName }: { interests: InsightData['interests'], childName: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          Interest Strengths
        </CardTitle>
        <CardDescription>Areas of strongest curiosity and engagement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interests.map((interest, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getInterestIcon(interest.category)}
                  <span className="font-medium capitalize">{interest.category}</span>
                </div>
                <Badge variant="secondary">{interest.strength}% strength</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000 ease-out"
                  style={{ width: `${interest.strength}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {interest.examples.map((example, exIndex) => (
                  <Badge key={exIndex} variant="outline" className="text-xs">
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Development Progress Component
function DevelopmentChart({ development, childAge }: { development: InsightData['development'], childAge: number }) {
  const areas = [
    { name: 'Cognitive', value: development.cognitive, target: getAgeTarget(childAge, 'cognitive') },
    { name: 'Language', value: development.language, target: getAgeTarget(childAge, 'language') },
    { name: 'Social', value: development.social, target: getAgeTarget(childAge, 'social') },
    { name: 'Emotional', value: development.emotional, target: getAgeTarget(childAge, 'emotional') },
    { name: 'Physical', value: development.physical, target: getAgeTarget(childAge, 'physical') }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Developmental Progress
        </CardTitle>
        <CardDescription>Current development compared to age-appropriate milestones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {areas.map((area, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{area.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={area.value >= area.target ? "default" : "secondary"}>
                    {area.value}%
                  </Badge>
                  <span className="text-xs text-gray-500">Target: {area.target}%</span>
                </div>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-3">
                {/* Target line */}
                <div 
                  className="absolute top-0 w-0.5 h-3 bg-gray-400"
                  style={{ left: `${area.target}%` }}
                />
                {/* Progress bar */}
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                    area.value >= area.target ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(area.value, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {getdevelopmentDescription(area.name, area.value, area.target)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Learning Style Component
function LearningStyleChart({ learningStyle }: { learningStyle: InsightData['learningStyle'] }) {
  const styles = [
    { name: 'Visual', value: learningStyle.visual, icon: Eye, description: 'Learns through seeing and visual aids' },
    { name: 'Auditory', value: learningStyle.auditory, icon: Music, description: 'Learns through hearing and discussion' },
    { name: 'Kinesthetic', value: learningStyle.kinesthetic, icon: Zap, description: 'Learns through hands-on activities' },
    { name: 'Reading/Writing', value: learningStyle.reading, icon: BookOpen, description: 'Learns through text and writing' }
  ]

  const primaryStyle = styles.reduce((prev, current) => 
    prev.value > current.value ? prev : current
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-indigo-600" />
          Learning Style Profile
        </CardTitle>
        <CardDescription>How your child learns best</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {styles.map((style, index) => {
            const Icon = style.icon
            const isPrimary = style.name === primaryStyle.name
            return (
              <div key={index} className={`p-3 rounded-lg border ${isPrimary ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${isPrimary ? 'text-indigo-600' : 'text-gray-600'}`} />
                  <span className="font-medium">{style.name}</span>
                  {isPrimary && <Badge variant="default" className="text-xs">Primary</Badge>}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                      isPrimary ? 'bg-indigo-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${style.value}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">{style.description}</p>
                <Badge variant="outline" className="mt-1 text-xs">{style.value}%</Badge>
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
          <h4 className="font-medium text-indigo-900 mb-1">Recommendation</h4>
          <p className="text-sm text-indigo-800">
            {getLearningRecommendation(primaryStyle.name)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Visualization Page Component
export default function InsightVisualizationPage() {
  const searchParams = useSearchParams()
  const childId = searchParams.get('childId')
  
  const [insightData, setInsightData] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (childId) {
      fetchInsightData(childId)
    }
  }, [childId])

  const fetchInsightData = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/insights/visualize/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        setInsightData(data)
      } else {
        setError('Failed to load insight data')
      }
    } catch (error) {
      console.error('Error fetching insight data:', error)
      setError('Failed to load insight data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Analyzing insights...</span>
        </div>
      </div>
    )
  }

  if (error || !insightData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Insights</h2>
          <p className="text-gray-600 mb-4">{error || 'No insight data available'}</p>
          <Button onClick={() => childId && fetchInsightData(childId)}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/insights">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Insights
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {insightData.childName}'s Insight Visualization
          </h1>
          <p className="text-gray-600">
            Comprehensive analysis of {insightData.totalInsights} conversation insights
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-8">
        {/* Personality Chart */}
        <PersonalityChart 
          personality={insightData.personality} 
          childName={insightData.childName}
        />
        
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Interests */}
          <InterestsChart 
            interests={insightData.interests}
            childName={insightData.childName}
          />
          
          {/* Learning Style */}
          <LearningStyleChart 
            learningStyle={insightData.learningStyle}
          />
        </div>
        
        {/* Development Progress */}
        <DevelopmentChart 
          development={insightData.development}
          childAge={insightData.childAge}
        />
      </div>
    </div>
  )
}

// Helper Functions
function getPersonalityDescription(trait: string, value: number): string {
  if (value >= 80) return `Very high ${trait.toLowerCase()} - exceptional strength in this area`
  if (value >= 60) return `High ${trait.toLowerCase()} - strong tendency towards this trait`
  if (value >= 40) return `Moderate ${trait.toLowerCase()} - balanced development`
  if (value >= 20) return `Developing ${trait.toLowerCase()} - growing in this area`
  return `Emerging ${trait.toLowerCase()} - early signs of development`
}

function getPersonalityType(personality: InsightData['personality']): string {
  const dominant = Object.entries(personality)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([key]) => key)

  const types: { [key: string]: string } = {
    'curiosity-creativity': 'Creative Explorer - Loves to discover and create new things',
    'curiosity-analytical': 'Scientific Mind - Enjoys investigating how things work',
    'social-emotional': 'Empathetic Communicator - Connects well with others emotionally',
    'creativity-emotional': 'Artistic Soul - Expresses feelings through creative activities',
    'analytical-physical': 'Hands-on Problem Solver - Learns by doing and experimenting',
  }

  const typeKey = dominant.sort().join('-')
  return types[typeKey] || `${dominant.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(' & ')} - A unique combination of strengths`
}

function getInterestIcon(category: string) {
  const icons: { [key: string]: any } = {
    science: <Target className="h-4 w-4 text-green-600" />,
    art: <Palette className="h-4 w-4 text-pink-600" />,
    music: <Music className="h-4 w-4 text-purple-600" />,
    nature: <Heart className="h-4 w-4 text-green-600" />,
    technology: <Zap className="h-4 w-4 text-blue-600" />,
    reading: <BookOpen className="h-4 w-4 text-indigo-600" />,
    games: <Gamepad2 className="h-4 w-4 text-orange-600" />,
    sports: <Zap className="h-4 w-4 text-red-600" />
  }
  return icons[category] || <Target className="h-4 w-4 text-gray-600" />
}

function getAgeTarget(age: number, area: string): number {
  const targets: { [key: string]: { [key: number]: number } } = {
    cognitive: { 3: 60, 4: 70, 5: 80, 6: 85, 7: 90 },
    language: { 3: 65, 4: 75, 5: 85, 6: 90, 7: 95 },
    social: { 3: 50, 4: 60, 5: 70, 6: 80, 7: 85 },
    emotional: { 3: 45, 4: 55, 5: 65, 6: 75, 7: 80 },
    physical: { 3: 70, 4: 80, 5: 85, 6: 90, 7: 95 }
  }
  return targets[area]?.[age] || 70
}

function getdevelopmentDescription(area: string, value: number, target: number): string {
  if (value >= target + 10) return `Exceeding expectations for ${area.toLowerCase()} development`
  if (value >= target) return `Meeting age-appropriate ${area.toLowerCase()} milestones`
  if (value >= target - 10) return `Developing well in ${area.toLowerCase()} skills`
  return `Growing in ${area.toLowerCase()} development with room for support`
}

function getLearningRecommendation(primaryStyle: string): string {
  const recommendations: { [key: string]: string } = {
    'Visual': 'Use colorful books, charts, and visual aids. Try drawing, mind maps, and educational videos.',
    'Auditory': 'Engage through storytelling, music, and discussions. Read aloud and use rhymes or songs.',
    'Kinesthetic': 'Provide hands-on activities, building toys, and movement-based learning. Let them explore through touch.',
    'Reading/Writing': 'Encourage journaling, writing stories, and reading together. Use books as primary learning tools.'
  }
  return recommendations[primaryStyle] || 'Use a variety of learning approaches to support their development.'
}
