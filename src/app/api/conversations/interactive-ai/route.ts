import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { openai } from '@/lib/openai'

interface AIResponse {
  type: 'question' | 'fact' | 'encouragement' | 'challenge' | 'wonder'
  content: string
  reasoning: string
  urgency: 'low' | 'medium' | 'high'
  shouldSpeak: boolean
}

export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're available in catch
  let childId: string = ''
  let childName: string = ''
  let childAge: number = 0
  
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestBody = await request.json()
    childId = requestBody.childId
    childName = requestBody.childName || 'friend'
    childAge = requestBody.childAge || 5
    const { conversationHistory, conversationPhase, childInteractionCount, userInput } = requestBody

    if (!childId || !childName || childAge === undefined) {
      return NextResponse.json(
        { error: 'Child information is required' },
        { status: 400 }
      )
    }

    // Generate interactive AI response based on conversation phase
    const prompt = `
You are an AI conversation partner speaking DIRECTLY to ${childName}, a ${childAge}-year-old child. You will participate actively in their conversation, not just give advice to parents.

CONVERSATION PHASE: ${conversationPhase || 'active'}
INTERACTION COUNT: ${childInteractionCount || 0}
CONVERSATION HISTORY: ${conversationHistory.length > 0 ? conversationHistory.join('\n') : 'Just starting...'}
${userInput ? `\nCHILD JUST SAID: "${userInput}"` : ''}

YOUR ROLE:
- You are a curious, friendly AI who loves learning WITH children
- Speak directly to the child, not to the parent
- Ask questions that build on what you've heard
- Share amazing facts that connect to their interests
- Encourage their curiosity and wonder

CONVERSATION PHASE GUIDELINES:

INTRO (0-2 interactions): 
- Welcome the child warmly
- Ask open-ended questions about their interests
- Show excitement about their curiosity
- Keep it simple and engaging

ACTIVE (3-5 interactions):
- Build on topics they've mentioned
- Ask "why" and "how" questions
- Share related facts that will amaze them
- Encourage them to think deeper

DEEPER (6-8 interactions):
- Challenge them with thought experiments
- Connect different ideas together
- Ask them to predict or imagine scenarios
- Help them see patterns and connections

WRAP (8+ interactions):
- Celebrate their amazing thinking
- Help them reflect on what they've discovered
- Encourage them to keep being curious
- End with a sense of accomplishment

RESPONSE TYPES:
- question: Ask the child something thought-provoking
- fact: Share an amazing fact related to their interests
- encouragement: Celebrate their curiosity and thinking
- challenge: Present a fun mental puzzle or thought experiment
- wonder: Express shared amazement about the world

IMPORTANT:
- Always speak TO the child, not ABOUT them
- Use age-appropriate language for ${childAge} years old
- Be enthusiastic and genuinely curious
- Make them feel like a real scientist/explorer
- Keep responses to 1-2 sentences for speaking aloud
${userInput ? `- RESPOND DIRECTLY to what ${childName} just said: "${userInput}"` : ''}
${userInput ? `- If they asked a question, try to answer it in a simple, age-appropriate way` : ''}
${userInput ? `- If they made a statement, show interest and ask a related question` : ''}

Return JSON with this structure:
{
  "type": "question|fact|encouragement|challenge|wonder",
  "content": "What you would say directly to the child (keep it short for speaking)",
  "reasoning": "Why this helps the child's development",
  "urgency": "low|medium|high",
  "shouldSpeak": true
}

Base urgency on:
- High: Child seems very engaged, perfect moment to deepen
- Medium: Good opportunity to introduce new concepts
- Low: Gentle encouragement or reflection
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a friendly AI that speaks directly to children to encourage their curiosity and learning. Always respond as if talking TO the child, not about them.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.8
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Clean and parse the response
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    const aiResponse: AIResponse = JSON.parse(cleanContent)

    return NextResponse.json(aiResponse)

  } catch (error) {
    console.error('Interactive AI error:', error)
    
    // Provide engaging fallback responses
    const fallbackResponses: AIResponse[] = [
      {
        type: 'question',
        content: `${childName}, what's the most interesting thing you've noticed today?`,
        reasoning: "Open-ended questions encourage observation and reflection",
        urgency: 'medium',
        shouldSpeak: true
      },
      {
        type: 'wonder',
        content: `Wow ${childName}, I wonder what would happen if we could see with our ears like bats do!`,
        reasoning: "Imagination exercises develop creative thinking",
        urgency: 'medium',
        shouldSpeak: true
      },
      {
        type: 'fact',
        content: `Did you know butterflies taste with their feet? Nature is so amazing!`,
        reasoning: "Surprising facts spark curiosity about the natural world",
        urgency: 'low',
        shouldSpeak: true
      },
      {
        type: 'encouragement',
        content: `You're such a great question-asker, ${childName}! Scientists ask lots of questions too.`,
        reasoning: "Positive reinforcement builds confidence in curiosity",
        urgency: 'low',
        shouldSpeak: true
      },
      {
        type: 'challenge',
        content: `${childName}, if you could invent something to help animals, what would it be?`,
        reasoning: "Creative challenges develop problem-solving skills",
        urgency: 'medium',
        shouldSpeak: true
      }
    ]

    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    
    return NextResponse.json(randomResponse)
  }
}
