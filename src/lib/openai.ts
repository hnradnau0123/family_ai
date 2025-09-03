import OpenAI from 'openai'
import { isDemoMode, getDemoConversationStarter, demoConfig } from './demo-config'

// Allow demo mode without throwing error
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey && !isDemoMode) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

export const openai = new OpenAI({
  apiKey: apiKey || 'demo-key',
})

export interface ConversationAnalysis {
  curiosityIndicators: {
    questionCount: number
    questionTypes: string[]
    speculativeLanguage: string[]
    persistentTopics: string[]
    epistemicCuriosity: number
    diversiveCuriosity: number
    specificCuriosity: number
    perceptualCuriosity: number
  }
  cognitiveStrengths: {
    linguistic: number
    logicalMathematical: number
    spatial: number
    interpersonal: number
    intrapersonal: number
    naturalistic: number
  }
  executiveFunctions: {
    workingMemory: number
    cognitiveFlexibility: number
    inhibitoryControl: number
  }
  developmentalAnalysis: {
    piagetianStage: string
    zpdOpportunities: string[]
    languageComplexity: number
    socialEmotionalLevel: number
  }
  insights: {
    type: string
    category: string
    title: string
    description: string
    academicBasis: string
    parentRecommendations: string[]
    confidence: number
  }[]
}

export async function analyzeConversation(
  transcription: string,
  childName: string,
  childAge: number
): Promise<ConversationAnalysis> {
  const prompt = `
You are a child development expert with expertise in developmental psychology, analyzing a conversation between a parent and their ${childAge}-year-old child named ${childName}.

Apply established psychological frameworks to analyze this conversation transcript:

${transcription}

ANALYSIS FRAMEWORK:

1. **Piaget's Cognitive Development Theory Analysis**:
   - Assess if child demonstrates concrete operational (7-11) vs preoperational (2-7) thinking patterns
   - Look for conservation understanding, logical reasoning, or symbolic thinking
   - Identify cognitive schemas being applied or constructed

2. **Vygotsky's Zone of Proximal Development**:
   - What can the child do independently vs with guidance?
   - Identify potential learning opportunities where scaffolding could advance development
   - Note language mediation and social construction of knowledge

3. **Gardner's Multiple Intelligence Theory Assessment**:
   - Linguistic: Complex sentence structure, vocabulary range, narrative coherence, metaphorical thinking
   - Logical-Mathematical: Sequencing, pattern recognition, cause-effect reasoning, numerical concepts
   - Spatial: Mental imagery, visual-spatial relationships, directional awareness
   - Interpersonal: Theory of mind, empathy, social cognition, perspective-taking
   - Intrapersonal: Metacognition, self-reflection, emotional awareness, personal insight
   - Naturalistic: Classification skills, environmental awareness, living systems understanding

4. **Executive Function Development** (rate 0-10):
   - Working Memory: Holding and manipulating information
   - Cognitive Flexibility: Switching between concepts or adapting to new rules
   - Inhibitory Control: Impulse control and focused attention

5. **Language Development Analysis**:
   - Syntactic complexity and grammatical sophistication
   - Semantic understanding and vocabulary depth
   - Pragmatic language use and conversational skills
   - Metalinguistic awareness

6. **Research-Based Curiosity Assessment**:
   - **Epistemic Curiosity**: Desire to acquire knowledge and eliminate uncertainty
   - **Diversive Curiosity**: Seeking stimulation to escape boredom
   - **Specific Curiosity**: Focused interest in particular phenomena
   - **Perceptual Curiosity**: Attraction to novel or surprising stimuli

7. **Social-Emotional Learning Indicators**:
   - Emotional regulation and expression
   - Social awareness and relationship skills
   - Responsible decision-making patterns

8. **Deep Insights** (Provide 3-4 insights with academic grounding):
   - Reference specific developmental theories and research findings
   - Explain WHY these patterns matter for the child's development
   - Provide evidence-based recommendations for parents
   - Include developmental trajectory predictions

Return ONLY a valid JSON object (no markdown formatting, no code blocks, no explanations) with the exact structure:
{
  "curiosityIndicators": {
    "questionCount": number,
    "questionTypes": ["what", "how", "why"],
    "speculativeLanguage": ["specific phrases found"],
    "persistentTopics": ["topics child returned to"],
    "epistemicCuriosity": number (0-10),
    "diversiveCuriosity": number (0-10),
    "specificCuriosity": number (0-10),
    "perceptualCuriosity": number (0-10)
  },
  "cognitiveStrengths": {
    "linguistic": number (0-10),
    "logicalMathematical": number (0-10),
    "spatial": number (0-10),
    "interpersonal": number (0-10),
    "intrapersonal": number (0-10),
    "naturalistic": number (0-10)
  },
  "executiveFunctions": {
    "workingMemory": number (0-10),
    "cognitiveFlexibility": number (0-10),
    "inhibitoryControl": number (0-10)
  },
  "developmentalAnalysis": {
    "piagetianStage": "preoperational|concrete operational|formal operational",
    "zpdOpportunities": ["specific learning opportunities"],
    "languageComplexity": number (0-10),
    "socialEmotionalLevel": number (0-10)
  },
  "insights": [
    {
      "type": "cognitive_development|language_development|executive_function|curiosity_pattern|social_emotional",
      "category": "specific psychological domain",
      "title": "Research-grounded insight title",
      "description": "Deep analysis of what this reveals about child development",
      "academicBasis": "Reference to specific theory/research (e.g., 'Piaget's conservation theory', 'Vygotsky's ZPD')",
      "parentRecommendations": ["specific actionable recommendations"],
      "confidence": number (0.0-1.0)
    }
  ]
}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert child development psychologist specializing in analyzing parent-child conversations to identify curiosity patterns and cognitive strengths. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Clean the content to handle markdown code blocks
    let cleanContent = content.trim()
    
    // Remove markdown code block markers if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    return JSON.parse(cleanContent) as ConversationAnalysis
  } catch (error) {
    console.error('Error analyzing conversation:', error)
    throw new Error('Failed to analyze conversation')
  }
}

export async function generateConversationStarter(
  childName: string,
  childAge: number,
  recentInsights: string[] = []
): Promise<string> {
  const prompt = `
Generate a conversation starter for a parent to use with their ${childAge}-year-old child named ${childName}.

${recentInsights.length > 0 ? `Recent insights about ${childName}: ${recentInsights.join(', ')}` : ''}

The conversation starter should:
- Be age-appropriate and engaging
- Encourage curiosity and open-ended thinking
- Be suitable for daily routines (dinner, walk, bedtime)
- Avoid yes/no questions
- Be specific enough to spark interest but open enough for exploration

Return just the conversation starter text, nothing else.
`

  // Use demo mode if OpenAI is not available
  if (isDemoMode) {
    const starter = getDemoConversationStarter()
    return starter.replace(/\{childName\}/g, childName)
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a child development expert who creates engaging conversation starters for parents and children.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    })

    return response.choices[0]?.message?.content?.trim() || 'What do you think would happen if we could talk to animals?'
  } catch (error) {
    console.error('Error generating conversation starter:', error)
    // Fallback to demo mode
    const starter = getDemoConversationStarter()
    return starter.replace(/\{childName\}/g, childName)
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const file = new File([new Uint8Array(audioBuffer)], 'audio.wav', { type: 'audio/wav' })
    
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    })

    return response.text
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw new Error('Failed to transcribe audio')
  }
}
