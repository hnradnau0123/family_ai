import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface InsightAnalysis {
  interests: string[]
  personality: string[]
  learningStyle: string[]
  curiosityTopics: string[]
  develoopmentalLevel: string
  strengths: string[]
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
  let childId: string
  let session: any
  
  try {
    console.log('🎯 Generating recommendations API called')
    
    session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('❌ Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paramData = await params
    childId = paramData.childId
    console.log('📨 Generating recommendations for child:', childId)

    // Fetch child data and verify ownership
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: session.user.id
      },
      include: {
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            insights: true
          }
        },
        recommendations: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!child) {
      console.log('❌ Child not found or unauthorized')
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    console.log('✅ Found child:', child.name, 'with', child.conversations.length, 'conversations')
    console.log('📦 Existing recommendations:', child.recommendations.length)

    // Check if we have recent recommendations (within last 7 days)
    const recentRecommendations = child.recommendations.filter(rec => {
      const daysSinceCreated = (Date.now() - new Date(rec.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceCreated < 7
    })

    // If we have existing recommendations and good data, convert them to the expected format
    if (recentRecommendations.length >= 4) {
      console.log('✅ Using existing recommendations from database')
      
      const dbRecommendations = convertDbRecommendationsToFormat(child.recommendations, child.name, getChildAge(child.birthDate))
      console.log('🚀 Returning database recommendations for', child.name)
      return NextResponse.json(dbRecommendations)
    }

    // If no recent recommendations or insufficient data, generate new ones
    console.log('🎯 Generating new AI recommendations...')

    // Analyze insights from recent conversations
    const allInsights = child.conversations.flatMap(conv => conv.insights)
    console.log('📊 Analyzing', allInsights.length, 'insights')

    // Extract key information from insights
    const insightAnalysis = analyzeInsights(allInsights, child)
    console.log('🧠 Insight analysis:', insightAnalysis)

    // Generate recommendations using OpenAI
    const { openai } = await import('@/lib/openai')
    
    const recommendationPrompt = `
You are a child development expert creating personalized recommendations for ${child.name}, age ${getChildAge(child.birthDate)}.

CHILD ANALYSIS:
- Interests: ${insightAnalysis.interests.join(', ') || 'General exploration'}
- Personality Traits: ${insightAnalysis.personality.join(', ') || 'Curious and developing'}
- Learning Style: ${insightAnalysis.learningStyle.join(', ') || 'Visual and hands-on'}
- Curiosity Topics: ${insightAnalysis.curiosityTopics.join(', ') || 'Wide range of topics'}
- Developmental Level: ${insightAnalysis.develoopmentalLevel || 'Age-appropriate'}
- Strengths: ${insightAnalysis.strengths.join(', ') || 'Problem-solving and creativity'}

RECENT CONVERSATION THEMES:
${child.conversations.slice(0, 3).map(conv => `- ${conv.title}: ${conv.transcription.slice(0, 100)}...`).join('\n')}

Create personalized recommendations in the following categories. Make them specific, age-appropriate, and aligned with the child's demonstrated interests and developmental needs.

Return ONLY valid JSON in this exact format:
{
  "content": {
    "music": [
      {
        "title": "Song Title",
        "artist": "Artist Name",
        "reason": "Why this matches their interests/personality",
        "ageAppropriate": true,
        "mood": "happy/calm/energetic/creative"
      }
    ],
    "movies": [
      {
        "title": "Movie Title",
        "genre": "Genre",
        "reason": "Connection to their interests and developmental needs",
        "duration": "90 min",
        "rating": "G/PG"
      }
    ],
    "shows": [
      {
        "title": "Show Title",
        "platform": "Netflix/Disney+/etc",
        "reason": "How it supports their learning and interests",
        "episodes": "20 episodes",
        "educational": true/false
      }
    ],
    "anime": [
      {
        "title": "Anime Title",
        "reason": "Age-appropriate connection to interests",
        "ageRating": "All Ages/7+",
        "themes": ["friendship", "adventure", "creativity"]
      }
    ]
  },
  "activities": {
    "hobbies": [
      {
        "name": "Hobby Name",
        "description": "What this hobby involves",
        "reason": "How it connects to their interests and development",
        "difficulty": "Beginner/Intermediate",
        "materials": ["item1", "item2", "item3"]
      }
    ],
    "lessons": [
      {
        "name": "Lesson Type",
        "type": "Online/In-person/Workshop",
        "reason": "Developmental benefits aligned with their strengths",
        "frequency": "Weekly/Bi-weekly",
        "benefits": ["skill1", "skill2", "skill3"]
      }
    ],
    "events": [
      {
        "name": "Event Name",
        "location": "Local venue type",
        "reason": "Connection to interests and family bonding",
        "date": "This weekend/Next month",
        "familyFriendly": true
      }
    ]
  },
  "generatedAt": "${new Date().toISOString()}",
  "childName": "${child.name}",
  "childAge": ${getChildAge(child.birthDate)}
}

GUIDELINES:
- Provide 3-4 items per category
- Make recommendations specific and actionable
- Consider the child's age, interests, and developmental stage
- Include variety in difficulty levels and types
- Prioritize educational value while maintaining fun
- Consider family bonding opportunities
- Use real, available content and activities when possible
`

    console.log('🤖 Calling OpenAI for recommendations')
    
    // Add timeout wrapper for OpenAI call
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI call timed out after 30 seconds')), 30000)
    )
    
    const completionPromise = openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'system', content: recommendationPrompt }],
      max_tokens: 2000,
      temperature: 0.7
    })
    
    const completion = await Promise.race([completionPromise, timeoutPromise]) as any

    const responseText = completion.choices[0]?.message?.content
    console.log('🤖 OpenAI raw response:', responseText?.slice(0, 200) + '...')
    
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    let recommendations
    try {
      const cleanResponse = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim()
      recommendations = JSON.parse(cleanResponse)
      console.log('✅ Successfully parsed recommendations')
    } catch (parseError) {
      console.error('❌ Failed to parse recommendations:', parseError)
      // Return fallback recommendations
      recommendations = generateFallbackRecommendations(child.name, getChildAge(child.birthDate))
    }

    console.log('🚀 Returning recommendations for', child.name)
    return NextResponse.json(recommendations)

  } catch (error) {
    console.error('❌ Recommendation generation error:', error)
    
    // Try to fall back to existing database recommendations
    try {
      console.log('🔄 Falling back to existing recommendations from database...')
      const child = await prisma.child.findFirst({
        where: { id: childId, parentId: session!.user!.id },
        include: { recommendations: { where: { isActive: true }, orderBy: { createdAt: 'desc' } } }
      })
      
      if (child && child.recommendations.length > 0) {
        const fallbackRecommendations = convertDbRecommendationsToFormat(
          child.recommendations, 
          child.name, 
          getChildAge(child.birthDate)
        )
        console.log('✅ Returning fallback recommendations from database')
        return NextResponse.json(fallbackRecommendations)
      } else {
        // Last resort: generate simple fallback recommendations
        console.log('🔄 Generating simple fallback recommendations...')
        const simpleFallback = generateFallbackRecommendations(child?.name || 'Child', getChildAge(child?.birthDate || new Date()))
        return NextResponse.json(simpleFallback)
      }
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError)
      return NextResponse.json(
        { error: 'Failed to generate recommendations' },
        { status: 500 }
      )
    }
  }
}

function analyzeInsights(insights: any[], child: any): InsightAnalysis {
  const interests: string[] = []
  const personality: string[] = []
  const learningStyle: string[] = []
  const curiosityTopics: string[] = []
  const strengths: string[] = []

  insights.forEach(insight => {
    try {
      if (insight.metadata) {
        const metadata = typeof insight.metadata === 'string' 
          ? JSON.parse(insight.metadata) 
          : insight.metadata

        // Extract interests from various metadata fields
        if (metadata.interests) interests.push(...metadata.interests)
        if (metadata.curiosityPatterns) curiosityTopics.push(...metadata.curiosityPatterns)
        if (metadata.strengths) strengths.push(...metadata.strengths)
        if (metadata.personalityTraits) personality.push(...metadata.personalityTraits)
        if (metadata.learningPreferences) learningStyle.push(...metadata.learningPreferences)
        
        // Extract from academic analysis
        if (metadata.academicBasis?.executiveFunctions) {
          strengths.push(...Object.keys(metadata.academicBasis.executiveFunctions))
        }
        if (metadata.academicBasis?.developmentalAnalysis?.interests) {
          interests.push(...metadata.academicBasis.developmentalAnalysis.interests)
        }
      }

      // Also extract from insight content
      if (insight.content && typeof insight.content === 'string') {
        const content = insight.content.toLowerCase()
        
        // Look for interest keywords
        if (content.includes('science') || content.includes('experiment')) interests.push('science')
        if (content.includes('art') || content.includes('draw') || content.includes('color')) interests.push('art')
        if (content.includes('music') || content.includes('song')) interests.push('music')
        if (content.includes('nature') || content.includes('animal') || content.includes('outside')) interests.push('nature')
        if (content.includes('book') || content.includes('story') || content.includes('read')) interests.push('reading')
        if (content.includes('build') || content.includes('construct') || content.includes('create')) interests.push('building')
      }
    } catch (error) {
      console.error('Error parsing insight metadata:', error)
    }
  })

  return {
    interests: [...new Set(interests)], // Remove duplicates
    personality: [...new Set(personality)],
    learningStyle: [...new Set(learningStyle)],
    curiosityTopics: [...new Set(curiosityTopics)],
    develoopmentalLevel: determineDevLevel(getChildAge(child.birthDate)),
    strengths: [...new Set(strengths)]
  }
}

function getChildAge(birthDate: string | Date): number {
  const birth = new Date(birthDate)
  const now = new Date()
  return Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function determineDevLevel(age: number): string {
  if (age <= 3) return 'Toddler - sensory exploration and basic concepts'
  if (age <= 5) return 'Preschool - imaginative play and early learning'
  if (age <= 8) return 'Early elementary - structured learning and skill building'
  if (age <= 12) return 'Elementary - complex thinking and specialized interests'
  return 'Pre-teen - independent exploration and identity formation'
}

function convertDbRecommendationsToFormat(dbRecommendations: any[], childName: string, childAge: number) {
  console.log('🔄 Converting', dbRecommendations.length, 'database recommendations')
  
  // Group recommendations by type and category
  const content = { music: [], movies: [], shows: [], anime: [] }
  const activities = { hobbies: [], lessons: [], events: [] }
  
  dbRecommendations.forEach(rec => {
    const tags = JSON.parse(rec.tags || '[]')
    
    if (rec.type === 'CONTENT') {
      if (rec.category.toLowerCase().includes('music')) {
        content.music.push({
          title: rec.title,
          artist: "Various Artists",
          reason: rec.description,
          ageAppropriate: true,
          mood: tags.includes('colorful') ? 'happy' : 'calm'
        })
      } else if (rec.category.toLowerCase().includes('movie')) {
        content.movies.push({
          title: rec.title,
          genre: "Family",
          reason: rec.description,
          duration: "90 min",
          rating: "G"
        })
      } else if (rec.category.toLowerCase().includes('show') || rec.category.toLowerCase().includes('tv')) {
        content.shows.push({
          title: rec.title,
          platform: "Various",
          reason: rec.description,
          episodes: "Multiple episodes",
          educational: tags.includes('learning') || tags.includes('educational')
        })
      } else if (rec.category.toLowerCase().includes('anime')) {
        content.anime.push({
          title: rec.title,
          reason: rec.description,
          ageRating: "All Ages",
          themes: tags
        })
      }
    } else if (rec.type === 'ACTIVITY') {
      if (rec.category.toLowerCase().includes('hobby')) {
        activities.hobbies.push({
          name: rec.title,
          description: rec.description,
          reason: `Based on interests: ${tags.join(', ')}`,
          difficulty: "Beginner",
          materials: tags.filter(tag => tag !== 'nature' && tag !== 'observation')
        })
      } else if (rec.category.toLowerCase().includes('lesson')) {
        activities.lessons.push({
          name: rec.title,
          type: "In-person",
          reason: rec.description,
          frequency: "Weekly",
          benefits: tags
        })
      } else if (rec.category.toLowerCase().includes('event')) {
        activities.events.push({
          name: rec.title,
          location: rec.location || "Local venue",
          reason: rec.description,
          date: "This weekend",
          familyFriendly: true
        })
      }
    }
  })
  
  // Fill in any missing categories with defaults if needed
  if (content.music.length === 0) {
    content.music.push({
      title: "Kid-Friendly Playlist",
      artist: "Various Artists",
      reason: "Age-appropriate music for daily activities",
      ageAppropriate: true,
      mood: "happy"
    })
  }
  
  if (content.movies.length === 0) {
    content.movies.push({
      title: "Family Movie Selection",
      genre: "Animation",
      reason: "Recommended based on age and interests",
      duration: "90 min",
      rating: "G"
    })
  }
  
  return {
    content,
    activities,
    generatedAt: new Date().toISOString(),
    childName: childName,
    childAge: childAge
  }
}

function generateFallbackRecommendations(childName: string, childAge: number) {
  const ageCategory = childAge <= 5 ? 'preschool' : childAge <= 8 ? 'elementary' : 'older'
  
  return {
    content: {
      music: [
        {
          title: ageCategory === 'preschool' ? "The Wheels on the Bus" : "Count on Me",
          artist: ageCategory === 'preschool' ? "Super Simple Songs" : "Bruno Mars",
          reason: `Age-appropriate music that encourages ${ageCategory === 'preschool' ? 'movement and learning' : 'positive values and friendship'}`,
          ageAppropriate: true,
          mood: "happy"
        }
      ],
      movies: [
        {
          title: ageCategory === 'preschool' ? "Finding Nemo" : "Inside Out",
          genre: "Animation",
          reason: `Supports emotional development and curiosity about ${ageCategory === 'preschool' ? 'ocean life' : 'feelings and growing up'}`,
          duration: "90 min",
          rating: "G"
        }
      ],
      shows: [
        {
          title: ageCategory === 'preschool' ? "Bluey" : "Avatar: The Last Airbender",
          platform: ageCategory === 'preschool' ? "Disney+" : "Netflix",
          reason: `Encourages ${ageCategory === 'preschool' ? 'imagination and family play' : 'perseverance and friendship'}`,
          episodes: ageCategory === 'preschool' ? "150+ episodes" : "61 episodes",
          educational: true
        }
      ],
      anime: [
        {
          title: ageCategory === 'preschool' ? "My Neighbor Totoro" : "Kiki's Delivery Service",
          reason: "Gentle storytelling that nurtures imagination and independence",
          ageRating: "All Ages",
          themes: ["friendship", "nature", "growing up"]
        }
      ]
    },
    activities: {
      hobbies: [
        {
          name: ageCategory === 'preschool' ? "Nature Collecting" : "Science Experiments",
          description: ageCategory === 'preschool' ? "Collecting leaves, rocks, and flowers" : "Safe kitchen science experiments",
          reason: "Encourages observation skills and curiosity about the natural world",
          difficulty: "Beginner",
          materials: ageCategory === 'preschool' ? ["collection box", "magnifying glass"] : ["baking soda", "vinegar", "food coloring"]
        }
      ],
      lessons: [
        {
          name: ageCategory === 'preschool' ? "Music & Movement" : "Art Classes",
          type: "In-person",
          reason: "Supports creative expression and motor skill development",
          frequency: "Weekly",
          benefits: ["creativity", "coordination", "social skills"]
        }
      ],
      events: [
        {
          name: ageCategory === 'preschool' ? "Children's Museum Visit" : "Science Museum Workshop",
          location: "Local museum",
          reason: "Hands-on learning experience that sparks curiosity",
          date: "This weekend",
          familyFriendly: true
        }
      ]
    },
    generatedAt: new Date().toISOString(),
    childName: childName,
    childAge: childAge
  }
}
