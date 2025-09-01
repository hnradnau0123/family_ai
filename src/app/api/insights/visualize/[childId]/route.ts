import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface InsightAnalysis {
  personality: {
    curiosity: number
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
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    console.log('🎯 Generating insight visualization data')
    
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.id) {
      console.log('❌ Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { childId } = await params
    console.log('📊 Analyzing insights for child:', childId)

    // Fetch child data with insights
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: (session?.user as any)?.id
      },
      include: {
        insights: {
          orderBy: { createdAt: 'desc' },
          take: 50 // Analyze recent insights
        },
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            insights: true
          }
        }
      }
    })

    if (!child) {
      console.log('❌ Child not found or unauthorized')
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    console.log('✅ Found child:', child.name, 'with', child.insights.length, 'insights')

    // Calculate child age
    const childAge = Math.floor(
      (Date.now() - child.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )

    // Analyze insights to create visualization data
    const analysis = analyzeInsightsForVisualization(child.insights, child.conversations)
    
    // Structure the response
    const visualizationData = {
      childId: child.id,
      childName: child.name,
      childAge,
      totalInsights: child.insights.length,
      ...analysis,
      generatedAt: new Date().toISOString()
    }

    console.log('🚀 Returning visualization data for', child.name)
    return NextResponse.json(visualizationData)

  } catch (error) {
    console.error('❌ Insight visualization error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insight visualization' },
      { status: 500 }
    )
  }
}

function analyzeInsightsForVisualization(insights: any[], conversations: any[]): InsightAnalysis {
  console.log('🧠 Analyzing', insights.length, 'insights for visualization')
  
  // Initialize counters
  const personalityScores = {
    curiosity: 0,
    creativity: 0,
    social: 0,
    analytical: 0,
    emotional: 0,
    physical: 0
  }
  
  const interestCategories: { [key: string]: { count: number, examples: Set<string> } } = {}
  const learningIndicators = {
    visual: 0,
    auditory: 0,
    kinesthetic: 0,
    reading: 0
  }
  
  const developmentIndicators = {
    cognitive: 0,
    language: 0,
    social: 0,
    emotional: 0,
    physical: 0
  }
  
  const conversationPatterns = {
    questionAsking: 0,
    storyTelling: 0,
    hypothetical: 0,
    factual: 0
  }

  // Analyze each insight
  insights.forEach(insight => {
    try {
      // Parse metadata if available
      let metadata = null
      if (insight.metadata) {
        metadata = typeof insight.metadata === 'string' 
          ? JSON.parse(insight.metadata) 
          : insight.metadata
      }

      // Analyze insight type and category for personality traits
      const type = insight.type?.toLowerCase() || ''
      const category = insight.category?.toLowerCase() || ''
      const content = insight.content?.toLowerCase() || ''
      const confidence = insight.confidence || 0.5

      // Personality analysis based on insight types
      if (type.includes('curiosity') || content.includes('why') || content.includes('how')) {
        personalityScores.curiosity += confidence * 20
      }
      
      if (type.includes('creative') || content.includes('imagine') || content.includes('story')) {
        personalityScores.creativity += confidence * 20
      }
      
      if (type.includes('social') || content.includes('friend') || content.includes('share')) {
        personalityScores.social += confidence * 20
      }
      
      if (type.includes('analytical') || content.includes('because') || content.includes('think')) {
        personalityScores.analytical += confidence * 20
      }
      
      if (type.includes('emotional') || content.includes('feel') || content.includes('happy') || content.includes('sad')) {
        personalityScores.emotional += confidence * 20
      }
      
      if (content.includes('move') || content.includes('run') || content.includes('build')) {
        personalityScores.physical += confidence * 20
      }

      // Interest category analysis
      const interestKeywords = {
        science: ['science', 'experiment', 'discover', 'test', 'observe'],
        art: ['draw', 'paint', 'color', 'create', 'beautiful'],
        nature: ['animal', 'tree', 'flower', 'outside', 'sky', 'ocean'],
        music: ['song', 'music', 'sing', 'dance', 'sound'],
        technology: ['computer', 'robot', 'machine', 'digital'],
        reading: ['book', 'story', 'read', 'letter', 'word'],
        games: ['play', 'game', 'fun', 'toy', 'puzzle'],
        sports: ['run', 'jump', 'ball', 'sport', 'exercise']
      }

      Object.entries(interestKeywords).forEach(([category, keywords]) => {
        const matches = keywords.filter(keyword => content.includes(keyword)).length
        if (matches > 0) {
          if (!interestCategories[category]) {
            interestCategories[category] = { count: 0, examples: new Set() }
          }
          interestCategories[category].count += matches * confidence
          
          // Extract examples from insight title
          if (insight.title && matches > 0) {
            interestCategories[category].examples.add(insight.title)
          }
        }
      })

      // Learning style indicators
      if (content.includes('see') || content.includes('look') || content.includes('watch')) {
        learningIndicators.visual += confidence * 15
      }
      if (content.includes('hear') || content.includes('listen') || content.includes('sound')) {
        learningIndicators.auditory += confidence * 15
      }
      if (content.includes('touch') || content.includes('feel') || content.includes('hold')) {
        learningIndicators.kinesthetic += confidence * 15
      }
      if (content.includes('read') || content.includes('write') || content.includes('letter')) {
        learningIndicators.reading += confidence * 15
      }

      // Development indicators
      if (type.includes('cognitive') || content.includes('think') || content.includes('understand')) {
        developmentIndicators.cognitive += confidence * 15
      }
      if (type.includes('language') || content.includes('word') || content.includes('talk')) {
        developmentIndicators.language += confidence * 15
      }
      if (content.includes('friend') || content.includes('play') || content.includes('share')) {
        developmentIndicators.social += confidence * 15
      }
      if (content.includes('feel') || content.includes('emotion') || content.includes('happy')) {
        developmentIndicators.emotional += confidence * 15
      }
      if (content.includes('move') || content.includes('run') || content.includes('jump')) {
        developmentIndicators.physical += confidence * 15
      }

      // Conversation patterns
      if (content.includes('?') || content.includes('why') || content.includes('what')) {
        conversationPatterns.questionAsking += confidence * 10
      }
      if (content.includes('story') || content.includes('once') || content.includes('then')) {
        conversationPatterns.storyTelling += confidence * 10
      }
      if (content.includes('if') || content.includes('would') || content.includes('could')) {
        conversationPatterns.hypothetical += confidence * 10
      }
      if (content.includes('fact') || content.includes('know') || content.includes('true')) {
        conversationPatterns.factual += confidence * 10
      }

    } catch (error) {
      console.error('Error processing insight:', error)
    }
  })

  // Analyze conversation transcripts for additional context
  conversations.forEach(conv => {
    if (conv.transcription) {
      const transcript = conv.transcription.toLowerCase()
      
      // Additional personality indicators from full conversations
      const questionCount = (transcript.match(/\?/g) || []).length
      personalityScores.curiosity += Math.min(questionCount * 2, 10)
      
      if (transcript.includes('create') || transcript.includes('imagine') || transcript.includes('pretend')) {
        personalityScores.creativity += 5
      }
    }
  })

  // Normalize scores to 0-100 range
  const normalizeScore = (score: number, maxExpected: number = 100) => {
    return Math.min(Math.round((score / maxExpected) * 100), 100)
  }

  // Convert interest categories to array format
  const interests = Object.entries(interestCategories)
    .map(([category, data]) => ({
      category,
      strength: normalizeScore(data.count, 20),
      examples: Array.from(data.examples).slice(0, 4) // Limit to 4 examples
    }))
    .filter(interest => interest.strength > 10) // Only include significant interests
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8) // Top 8 interests

  // If no significant interests found, add some defaults
  if (interests.length === 0) {
    interests.push(
      { category: 'exploration', strength: 60, examples: ['General curiosity', 'Asking questions'] },
      { category: 'creativity', strength: 50, examples: ['Imaginative play', 'Storytelling'] }
    )
  }

  return {
    personality: {
      curiosity: normalizeScore(personalityScores.curiosity),
      creativity: normalizeScore(personalityScores.creativity),
      social: normalizeScore(personalityScores.social),
      analytical: normalizeScore(personalityScores.analytical),
      emotional: normalizeScore(personalityScores.emotional),
      physical: normalizeScore(personalityScores.physical)
    },
    interests,
    development: {
      cognitive: Math.max(normalizeScore(developmentIndicators.cognitive), 40),
      language: Math.max(normalizeScore(developmentIndicators.language), 40),
      social: Math.max(normalizeScore(developmentIndicators.social), 35),
      emotional: Math.max(normalizeScore(developmentIndicators.emotional), 35),
      physical: Math.max(normalizeScore(developmentIndicators.physical), 45)
    },
    learningStyle: {
      visual: Math.max(normalizeScore(learningIndicators.visual), 25),
      auditory: Math.max(normalizeScore(learningIndicators.auditory), 25),
      kinesthetic: Math.max(normalizeScore(learningIndicators.kinesthetic), 25),
      reading: Math.max(normalizeScore(learningIndicators.reading), 25)
    },
    conversationPatterns: {
      questionAsking: normalizeScore(conversationPatterns.questionAsking),
      storyTelling: normalizeScore(conversationPatterns.storyTelling),
      hypothetical: normalizeScore(conversationPatterns.hypothetical),
      factual: normalizeScore(conversationPatterns.factual)
    }
  }
}
