import { openai } from './openai'
import { prisma } from './prisma'

export interface RecommendationRequest {
  childId: string
  childName: string
  childAge: number
  recentInsights: string[]
  topInterests: string[]
  cognitiveStrengths: string[]
}

export interface GeneratedRecommendation {
  type: 'BOOK' | 'ACTIVITY' | 'CLASS' | 'EXPERIENCE' | 'TOY' | 'GAME' | 'VIDEO'
  title: string
  description: string
  category: string
  ageGroup: string
  tags: string[]
  provider?: string
  url?: string
  location?: string
  price?: string
}

export async function generateRecommendations(
  request: RecommendationRequest
): Promise<GeneratedRecommendation[]> {
  const prompt = `
You are a child development expert creating personalized recommendations for ${request.childName}, a ${request.childAge}-year-old child.

Based on their profile:
- Recent insights: ${request.recentInsights.join(', ')}
- Top interests: ${request.topInterests.join(', ')}
- Cognitive strengths: ${request.cognitiveStrengths.join(', ')}

Generate 8-12 diverse, age-appropriate recommendations across different categories:
- Books (picture books, chapter books, educational books)
- Activities (crafts, experiments, outdoor activities)
- Classes (music, art, sports, coding, etc.)
- Experiences (museums, nature walks, workshops)
- Educational toys and games
- Educational videos/content

For each recommendation, provide:
- Type: BOOK, ACTIVITY, CLASS, EXPERIENCE, TOY, GAME, or VIDEO
- Title: Clear, engaging name
- Description: 2-3 sentences explaining why this matches the child's interests
- Category: Specific subcategory (e.g., "science experiment", "picture book", "art class")
- Age group: Appropriate age range
- Tags: 3-5 relevant keywords
- Provider: Where applicable (publisher, brand, institution)
- Estimated price range: "Free", "$", "$$", or "$$$"

Focus on recommendations that:
1. Match the child's demonstrated interests and strengths
2. Encourage curiosity and exploration
3. Are available in most communities or online
4. Offer different types of engagement (hands-on, social, individual, creative)

Return as a JSON array with this structure:
[
  {
    "type": "BOOK|ACTIVITY|CLASS|EXPERIENCE|TOY|GAME|VIDEO",
    "title": "Recommendation title",
    "description": "Detailed explanation of why this matches the child's interests and development",
    "category": "Specific category",
    "ageGroup": "Age range",
    "tags": ["tag1", "tag2", "tag3"],
    "provider": "Provider name (optional)",
    "price": "Free|$|$$|$$$"
  }
]
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a child development expert who creates personalized, actionable recommendations for families. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content) as GeneratedRecommendation[]
  } catch (error) {
    console.error('Error generating recommendations:', error)
    
    // Return fallback recommendations
    return [
      {
        type: 'BOOK',
        title: 'The Curious Kid\'s Science Book',
        description: 'Perfect for children who love asking "why" and "how" questions about the world around them.',
        category: 'science book',
        ageGroup: `${request.childAge}-${request.childAge + 2} years`,
        tags: ['science', 'experiments', 'curiosity'],
        price: '$'
      },
      {
        type: 'ACTIVITY',
        title: 'Nature Scavenger Hunt',
        description: 'Explore the outdoors while developing observation skills and connecting with nature.',
        category: 'outdoor activity',
        ageGroup: `${request.childAge}-${request.childAge + 3} years`,
        tags: ['nature', 'outdoor', 'observation'],
        price: 'Free'
      }
    ]
  }
}

export async function saveRecommendations(
  childId: string,
  recommendations: GeneratedRecommendation[]
) {
  // Deactivate old recommendations
  await prisma.recommendation.updateMany({
    where: { childId, isActive: true },
    data: { isActive: false }
  })

  // Save new recommendations
  const recommendationData = recommendations.map(rec => ({
    childId,
    type: rec.type,
    title: rec.title,
    description: rec.description,
    category: rec.category,
    ageGroup: rec.ageGroup,
    tags: JSON.stringify(rec.tags),
    provider: rec.provider,
    url: rec.url,
    location: rec.location,
    price: rec.price,
    isActive: true
  }))

  await prisma.recommendation.createMany({
    data: recommendationData
  })
}

export async function refreshRecommendations(childId: string) {
  try {
    // Get child data
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        insights: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!child) {
      throw new Error('Child not found')
    }

    const childAge = Math.floor(
      (Date.now() - child.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )

    // Analyze insights to extract interests and strengths
    const recentInsights = child.insights.map(insight => insight.title)
    const topInterests = [...new Set(
      child.insights
        .filter(insight => insight.category.includes('interest'))
        .map(insight => insight.category)
    )].slice(0, 5)
    
    const cognitiveStrengths = [...new Set(
      child.insights
        .filter(insight => insight.type === 'COGNITIVE_STRENGTH')
        .map(insight => insight.category)
    )].slice(0, 3)

    // Generate recommendations
    const recommendations = await generateRecommendations({
      childId,
      childName: child.name,
      childAge,
      recentInsights,
      topInterests,
      cognitiveStrengths
    })

    // Save recommendations
    await saveRecommendations(childId, recommendations)

    return recommendations
  } catch (error) {
    console.error('Error refreshing recommendations:', error)
    throw error
  }
}
