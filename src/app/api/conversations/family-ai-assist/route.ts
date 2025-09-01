import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Family AI Assist API called')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('❌ Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestData = await request.json()
    console.log('📨 Received request data:', requestData)
    
    const { 
      childId, 
      childName, 
      childAge, 
      conversationHistory, 
      conversationTheme,
      recentTranscription,
      speakerType
    } = requestData

    if (!childId || !childName) {
      console.log('❌ Missing required fields:', { childId, childName })
      return NextResponse.json(
        { error: 'Child ID and name are required' },
        { status: 400 }
      )
    }

    // Import OpenAI client
    const { openai } = await import('@/lib/openai')

    // Analyze conversation and provide family-focused facilitation
    const prompt = `
You are a family conversation facilitator AI helping a parent have a meaningful conversation with their ${childAge}-year-old child named ${childName}.

CRITICAL PRINCIPLES:
1. NEVER replace the parent - always suggest what the PARENT should say or ask
2. Focus on deepening the existing conversation thread, not changing topics
3. Provide specific, actionable guidance for the parent
4. Help establish and maintain a single conversation theme around ${childName}'s interests
5. Ask follow-up questions that build on responses, not rapid-fire new questions

Recent conversation context:
${conversationHistory.length > 0 ? conversationHistory.join('\n') : 'Conversation just started'}

Current theme: ${conversationTheme || 'Not established yet - help establish one based on child interest'}

${speakerType === 'child' ? `${childName} just said: "${recentTranscription}"` : ''}
${speakerType === 'parent' ? `Parent just said: "${recentTranscription}"` : ''}
${!speakerType ? `Recent input: "${recentTranscription || 'None yet'}"` : ''}

CONVERSATION FACILITATION STRATEGY:
${speakerType === 'child' ? `
CHILD JUST SPOKE - Provide parent guidance on how to respond:
- If child asked a question: Help parent guide child to think through the answer first
- If child made a statement: Suggest how parent can show interest and ask follow-up
- Focus on deepening THIS topic, not jumping to new ones
- Encourage parent to ask "why," "how," "what if" questions about what child said
` : ''}

${speakerType === 'parent' ? `
PARENT JUST SPOKE - Provide next step suggestions:
- Acknowledge parent's good response
- Suggest deeper follow-up questions on the SAME topic
- Help parent build on what child shared
- Encourage exploration of the current theme
` : ''}

THEME ESTABLISHMENT PRIORITY:
${!conversationTheme ? '- FIRST establish a conversation theme based on what interests the child most' : '- STAY focused on the established theme: ' + conversationTheme}

RESPONSE TYPES:
1. "follow_up" - Suggest a specific follow-up question about the SAME topic
2. "theme_suggestion" - Help establish or focus on a single conversation theme
3. "parent_guidance" - Guide parent on specific conversation techniques
4. "encouragement" - Acknowledge good conversation flow and deepen current topic

Return ONLY valid JSON:
{
  "type": "follow_up|theme_suggestion|parent_guidance|encouragement",
  "content": "Specific suggestion for what the parent should say",
  "parentGuidance": "Explanation of why this approach helps",
  "reasoning": "How this deepens the current conversation thread",
  "isForParent": true,
  "shouldSpeak": false
}

EXAMPLES:
Child says "Why is the sky blue?":
{
  "type": "parent_guidance",
  "content": "First ask ${childName}: 'What do you think makes the sky blue?' Then listen to their ideas before explaining.",
  "parentGuidance": "This helps children develop thinking skills by considering possibilities first.",
  "reasoning": "Builds on child's natural curiosity about colors and sky",
  "isForParent": true,
  "shouldSpeak": false
}

Parent explains something:
{
  "type": "follow_up", 
  "content": "Great explanation! Now ask: 'What else about the sky have you noticed?'",
  "parentGuidance": "This keeps exploring the same topic deeper rather than jumping to something new.",
  "reasoning": "Maintains focus on sky/weather theme while encouraging observation",
  "isForParent": true,
  "shouldSpeak": false
}
`

    console.log('🤖 Calling OpenAI with prompt for', speakerType, 'speech')
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    })

    const responseText = completion.choices[0]?.message?.content
    console.log('🤖 OpenAI raw response:', responseText)
    
    if (!responseText) {
      console.log('❌ No response from OpenAI')
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    let suggestion
    try {
      // Remove any markdown formatting
      const cleanResponse = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim()
      console.log('🧹 Cleaned response:', cleanResponse)
      suggestion = JSON.parse(cleanResponse)
      console.log('✅ Parsed suggestion:', suggestion)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      // Fallback suggestion
      suggestion = {
        type: 'parent_guidance',
        content: `Ask ${childName} to tell you more about what they're thinking. Try: "What's the most interesting part about that?"`,
        parentGuidance: `Keep the conversation focused on ${childName}'s interests and ask open-ended questions.`,
        reasoning: 'Encouraging deeper exploration of child interests',
        isForParent: true
      }
    }

    return NextResponse.json(suggestion)

  } catch (error) {
    console.error('Family AI assist error:', error)
    
    // Return a helpful fallback suggestion
    return NextResponse.json({
      type: 'parent_guidance',
      content: 'Try asking an open-ended question like "What do you think about that?" or "Tell me more!"',
      parentGuidance: 'Open-ended questions help children share their thoughts and keep conversations flowing naturally.',
      reasoning: 'Basic conversation facilitation technique',
      isForParent: true
    })
  }
}
