'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Music, Film, Tv, Gamepad2, Palette, BookOpen, MapPin, Calendar, RefreshCw, Star, Clock, Users } from 'lucide-react'

interface RecommendationData {
  content: {
    music: Array<{
      title: string
      artist: string
      reason: string
      ageAppropriate: boolean
      mood: string
    }>
    movies: Array<{
      title: string
      genre: string
      reason: string
      duration: string
      rating: string
    }>
    shows: Array<{
      title: string
      platform: string
      reason: string
      episodes: string
      educational: boolean
    }>
    anime: Array<{
      title: string
      reason: string
      ageRating: string
      themes: string[]
    }>
  }
  activities: {
    hobbies: Array<{
      name: string
      description: string
      reason: string
      difficulty: string
      materials: string[]
    }>
    lessons: Array<{
      name: string
      type: string
      reason: string
      frequency: string
      benefits: string[]
    }>
    events: Array<{
      name: string
      location: string
      reason: string
      date: string
      familyFriendly: boolean
    }>
  }
  generatedAt: string
  childName: string
  childAge: number
}

async function getRecommendations(childId: string): Promise<RecommendationData | null> {
  try {
    console.log('🎯 Fetching recommendations for child:', childId)
    
    // Add timeout to prevent infinite loading
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout
    
    const response = await fetch(`/api/recommendations/${childId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Recommendations received:', data.childName || 'Unknown child')
      return data
    }
    console.log('❌ Recommendations API response not ok:', response.status)
    return null
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Recommendations request timed out after 45 seconds')
    } else {
      console.error('❌ Failed to fetch recommendations:', error)
    }
    return null
  }
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
      <span className="ml-2 text-gray-600">Generating personalized recommendations...</span>
    </div>
  )
}

function ContentRecommendations({ content }: { content: RecommendationData['content'] }) {
  return (
    <div className="space-y-6">
      {/* Music */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-purple-600" />
            <CardTitle>Music Recommendations</CardTitle>
          </div>
          <CardDescription>Songs and artists tailored to their interests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {content.music.map((song, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{song.title}</h4>
                    <p className="text-sm text-gray-600">by {song.artist}</p>
                  </div>
                  <Badge variant={song.ageAppropriate ? "default" : "secondary"}>
                    {song.mood}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">{song.reason}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Movies */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-blue-600" />
            <CardTitle>Movie Recommendations</CardTitle>
          </div>
          <CardDescription>Family-friendly films based on their personality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {content.movies.map((movie, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{movie.title}</h4>
                    <p className="text-sm text-gray-600">{movie.genre}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{movie.rating}</Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {movie.duration}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{movie.reason}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TV Shows */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-green-600" />
            <CardTitle>TV Show Recommendations</CardTitle>
          </div>
          <CardDescription>Series that match their curiosity and learning style</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {content.shows.map((show, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{show.title}</h4>
                    <p className="text-sm text-gray-600">{show.platform}</p>
                  </div>
                  <div className="flex gap-1">
                    {show.educational && (
                      <Badge variant="default">Educational</Badge>
                    )}
                    <Badge variant="outline">{show.episodes}</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{show.reason}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anime */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-orange-600" />
            <CardTitle>Anime Recommendations</CardTitle>
          </div>
          <CardDescription>Age-appropriate anime that align with their interests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {content.anime.map((anime, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{anime.title}</h4>
                    <Badge variant="outline">{anime.ageRating}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {anime.themes.map((theme, themeIndex) => (
                    <Badge key={themeIndex} variant="secondary" className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-700">{anime.reason}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ActivityRecommendations({ activities }: { activities: RecommendationData['activities'] }) {
  return (
    <div className="space-y-6">
      {/* Hobbies */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-pink-600" />
            <CardTitle>Hobby Recommendations</CardTitle>
          </div>
          <CardDescription>Creative and engaging activities to explore</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {activities.hobbies.map((hobby, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium">{hobby.name}</h4>
                  <Badge variant="outline">{hobby.difficulty}</Badge>
                </div>
                <p className="text-sm text-gray-600">{hobby.description}</p>
                <p className="text-sm text-gray-700">{hobby.reason}</p>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Materials needed:</p>
                  <div className="flex flex-wrap gap-1">
                    {hobby.materials.map((material, matIndex) => (
                      <Badge key={matIndex} variant="secondary" className="text-xs">
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lessons */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <CardTitle>Lesson Recommendations</CardTitle>
          </div>
          <CardDescription>Structured learning opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {activities.lessons.map((lesson, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{lesson.name}</h4>
                    <p className="text-sm text-gray-600">{lesson.type}</p>
                  </div>
                  <Badge variant="outline">{lesson.frequency}</Badge>
                </div>
                <p className="text-sm text-gray-700">{lesson.reason}</p>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Benefits:</p>
                  <div className="flex flex-wrap gap-1">
                    {lesson.benefits.map((benefit, benIndex) => (
                      <Badge key={benIndex} variant="secondary" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekend Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <CardTitle>Weekend Event Recommendations</CardTitle>
          </div>
          <CardDescription>Fun family activities and local events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {activities.events.map((event, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{event.name}</h4>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.location}
                    </p>
                  </div>
                  <div className="text-right">
                    {event.familyFriendly && (
                      <Badge variant="default" className="mb-1">
                        <Users className="h-3 w-3 mr-1" />
                        Family
                      </Badge>
                    )}
                    <p className="text-xs text-gray-500">{event.date}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{event.reason}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuggestionPlaylistPage() {
  const { data: session, status } = useSession()
  const [children, setChildren] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔍 Session status changed:', status)
    console.log('👤 Session data:', session)
    
    if (status === 'authenticated') {
      console.log('✅ User authenticated, fetching data...')
      fetchData()
    } else if (status === 'unauthenticated') {
      console.log('❌ User not authenticated')
    }
  }, [status, session])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching children data...')
      
      // Fetch children with better error handling
      const childrenResponse = await fetch('/api/children', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })
      
      console.log('📨 Children API response status:', childrenResponse.status)
      
      if (!childrenResponse.ok) {
        const errorText = await childrenResponse.text()
        console.error('❌ Children API error:', childrenResponse.status, errorText)
        throw new Error(`Failed to fetch children: ${childrenResponse.status} - ${errorText}`)
      }
      
      const childrenData = await childrenResponse.json()
      console.log('✅ Children data received:', childrenData.length, 'children')
      console.log('👶 Children:', childrenData.map((c: any) => ({ id: c.id, name: c.name })))
      
      setChildren(childrenData)
      
      if (childrenData.length > 0) {
        console.log('🎯 Fetching recommendations for:', childrenData[0].name)
        // Fetch recommendations for first child
        const recommendationsData = await getRecommendations(childrenData[0].id)
        setRecommendations(recommendationsData)
      } else {
        console.log('⚠️ No children found in response')
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const refreshRecommendations = async () => {
    if (children.length > 0) {
      setLoading(true)
      const recommendationsData = await getRecommendations(children[0].id)
      setRecommendations(recommendationsData)
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Please sign in to view recommendations</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Unable to Load Playlist</h2>
        <p className="text-red-600">{error}</p>
        <div className="text-sm text-gray-600">
          <p>Session status: {status}</p>
          <p>User ID: {(session?.user as any)?.id || 'Not available'}</p>
        </div>
        <Button onClick={fetchData} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  if (!children.length) {
    return (
      <div className="container mx-auto px-4 py-8 text-center space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">No Children Found</h2>
        <p className="text-gray-600">Please add a child profile first to get personalized recommendations.</p>
        
        {/* Debug information */}
        <div className="bg-gray-100 p-4 rounded-lg text-left text-sm">
          <h3 className="font-medium mb-2">Debug Information:</h3>
          <p><strong>Session Status:</strong> {status}</p>
          <p><strong>User Email:</strong> {session?.user?.email || 'Not available'}</p>
          <p><strong>User ID:</strong> {(session?.user as any)?.id || 'Not available'}</p>
          <p><strong>Children Found:</strong> {children.length}</p>
          {error && <p><strong>Last Error:</strong> {error}</p>}
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={fetchData} variant="outline">
            🔄 Retry Loading Children
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/children/new'}>
            Add Child Profile
          </Button>
        </div>
      </div>
    )
  }

  if (!recommendations) {
    return (
      <div className="container mx-auto px-4 py-8 text-center space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Generating Recommendations</h2>
        <p className="text-gray-600">We're analyzing {children[0].name}'s conversation insights to create personalized suggestions.</p>
        <LoadingSpinner />
        <Button onClick={refreshRecommendations} variant="outline">
          Try Loading Recommendations
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {recommendations.childName}'s Suggestion Playlist
          </h1>
          <p className="text-lg text-gray-600">
            Personalized recommendations based on conversation insights and interests
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline">Age {recommendations.childAge}</Badge>
            <Badge variant="outline">Updated {new Date(recommendations.generatedAt).toLocaleDateString()}</Badge>
            <Button variant="outline" size="sm" onClick={refreshRecommendations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Recommendations
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Gamepad2 className="h-6 w-6 mr-2 text-primary-600" />
              Content Recommendations
            </h2>
            <ContentRecommendations content={recommendations.content} />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Palette className="h-6 w-6 mr-2 text-secondary-600" />
              Activity Recommendations
            </h2>
            <ActivityRecommendations activities={recommendations.activities} />
          </div>
        </div>
      </div>
    </div>
  )
}
