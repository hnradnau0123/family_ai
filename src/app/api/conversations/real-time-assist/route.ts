import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { openai } from '@/lib/openai'

interface ConversationSuggestion {
  type: 'question' | 'fact' | 'activity' | 'encouragement'
  content: string
  reasoning: string
  urgency: 'low' | 'medium' | 'high'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestData = await request.json()
    console.log('Real-time assist API received:', requestData)
    
    const { childId, childName, childAge, conversationContext, recentTranscription } = requestData

    if (!childId || !childName || childAge === undefined || childAge === null) {
      console.log('Missing required fields:', { childId, childName, childAge })
      return NextResponse.json(
        { error: 'Child information is required', received: { childId, childName, childAge } },
        { status: 400 }
      )
    }

    // Generate real-time conversation suggestion
    const prompt = `
You are an expert child development specialist providing real-time conversation guidance to a parent talking with their ${childAge}-year-old child named ${childName}.

CONVERSATION CONTEXT:
${conversationContext.length > 0 ? conversationContext.join('\n---\n') : 'Beginning of conversation'}

RECENT TRANSCRIPTION:
${recentTranscription || 'No recent speech detected'}

CHILD DEVELOPMENT GOALS:
- Encourage epistemic curiosity (desire to learn and understand)
- Develop critical thinking and reasoning skills
- Build vocabulary and language complexity
- Foster social-emotional development
- Support executive function development

PROVIDE A SINGLE, ACTIONABLE SUGGESTION:

Consider these research-based conversation techniques:
1. **Socratic Questioning**: Guide the child to discover answers through questions
2. **Expansion**: Build on the child's interests with related concepts
3. **Scaffolding**: Provide just enough support to reach the next level
4. **Open-ended Questions**: Encourage elaboration and deeper thinking
5. **Wonder Aloud**: Model curiosity and thinking processes

Analyze the conversation and suggest:
- A specific question the parent should ask
- An interesting fact to share that connects to the child's interests
- A simple activity or thought experiment
- Encouragement when the child shows curiosity or effort

Return a JSON object with this structure:
{
  "type": "question|fact|activity|encouragement",
  "content": "Specific suggestion for the parent to use",
  "reasoning": "Brief explanation of why this suggestion helps the child's development",
  "urgency": "low|medium|high"
}

Base urgency on:
- High: Child asked a question or showed strong interest that needs immediate follow-up
- Medium: Good opportunity to deepen thinking or introduce new concepts
- Low: General guidance for maintaining engagement
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a child development expert providing real-time conversation coaching to parents. Respond with practical, research-based suggestions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
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

    const suggestion: ConversationSuggestion = JSON.parse(cleanContent)

    return NextResponse.json(suggestion)

  } catch (error) {
    console.error('Real-time assist error:', error)
    
    // Provide fallback suggestions if AI fails
    const fallbackSuggestions: ConversationSuggestion[] = [
      {
        type: 'question',
        content: "What do you think about that? Tell me more!",
        reasoning: "Open-ended questions encourage elaboration and deeper thinking",
        urgency: 'medium'
      },
      {
        type: 'question',
        content: "Why do you think that happens?",
        reasoning: "Why questions develop causal reasoning skills",
        urgency: 'medium'
      },
      {
        type: 'question',
        content: "How would you figure that out?",
        reasoning: "Encourages problem-solving and scientific thinking",
        urgency: 'medium'
      },
      {
        type: 'encouragement',
        content: "That's a really interesting question! You're thinking like a scientist.",
        reasoning: "Positive reinforcement builds confidence in curiosity",
        urgency: 'low'
      },
      {
        type: 'activity',
        content: "Let's imagine what would happen if... Can you picture it?",
        reasoning: "Imagination exercises develop creative and abstract thinking",
        urgency: 'medium'
      }
    ]

    const randomSuggestion = fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)]
    
    return NextResponse.json(randomSuggestion)
  }
}
