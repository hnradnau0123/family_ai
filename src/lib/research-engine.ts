interface ResearchDocument {
  id: string
  title: string
  content: string
  source: string
  category: 'child_development' | 'psychology' | 'education' | 'family_dynamics'
  keyTopics: string[]
  ageRange?: [number, number]
}

interface ResearchQuery {
  childAge: number
  conversationTopic: string
  parentGoal?: 'curiosity' | 'learning' | 'bonding' | 'problem_solving'
  currentContext: string
}

interface QuestionSuggestion {
  question: string
  rationale: string
  researchSource: string
  followUpQuestions: string[]
  expectedOutcome: string
}

class ResearchEngine {
  private documents: ResearchDocument[] = []
  
  constructor() {
    this.initializeResearchDatabase()
  }

  private initializeResearchDatabase() {
    this.documents = [
      {
        id: 'piaget-cognitive-dev',
        title: 'Piaget\'s Stages of Cognitive Development',
        content: `Jean Piaget identified four stages of cognitive development:
        
        1. Sensorimotor Stage (0-2 years): Children learn through sensory experiences and motor actions.
        2. Preoperational Stage (2-7 years): Symbolic thinking develops, but logical reasoning is limited.
        3. Concrete Operational Stage (7-11 years): Logical thinking about concrete objects develops.
        4. Formal Operational Stage (11+ years): Abstract thinking and hypothetical reasoning emerge.
        
        Key principles:
        - Children actively construct knowledge through experience
        - Development occurs through assimilation and accommodation
        - Each stage builds upon the previous one
        - Children cannot skip stages but may progress at different rates`,
        source: 'Piaget, J. (1952). The Origins of Intelligence in Children',
        category: 'child_development',
        keyTopics: ['cognitive development', 'logical thinking', 'abstract reasoning', 'symbolic thinking'],
        ageRange: [0, 18]
      },
      {
        id: 'vygotsky-zpd',
        title: 'Vygotsky\'s Zone of Proximal Development',
        content: `The Zone of Proximal Development (ZPD) is the difference between what a child can do independently and what they can do with guidance and support.
        
        Key concepts:
        - Scaffolding: Providing temporary support to help children reach higher levels
        - Social learning: Children learn through interaction with more knowledgeable others
        - Cultural tools: Language, symbols, and cultural practices mediate learning
        - Collaborative learning: Peer interaction can facilitate development
        
        Practical applications:
        - Ask questions slightly above the child's current level
        - Provide hints and guidance rather than direct answers
        - Encourage peer collaboration and discussion
        - Use the child's interests as a bridge to new learning`,
        source: 'Vygotsky, L. S. (1978). Mind in Society',
        category: 'child_development',
        keyTopics: ['scaffolding', 'social learning', 'guided discovery', 'collaborative learning'],
        ageRange: [2, 18]
      },
      {
        id: 'curiosity-research',
        title: 'The Science of Curiosity in Children',
        content: `Research on curiosity shows it has two main types:
        
        1. Diversive Curiosity: Seeking stimulation to escape boredom
        2. Epistemic Curiosity: Desire to acquire knowledge and close information gaps
        
        Factors that enhance curiosity:
        - Optimal level of uncertainty or surprise
        - Personal relevance and connection to interests
        - Safe environment for exploration
        - Open-ended questions that invite investigation
        - Celebrating questions and wondering
        
        The "Curiosity Gap Theory" suggests that curiosity is highest when:
        - Children are aware of an information gap
        - The gap is neither too small (boring) nor too large (overwhelming)
        - They believe the gap can be closed through exploration`,
        source: 'Loewenstein, G. (1994). The Psychology of Curiosity',
        category: 'psychology',
        keyTopics: ['curiosity types', 'information gaps', 'intrinsic motivation', 'exploration'],
        ageRange: [3, 18]
      },
      {
        id: 'questioning-techniques',
        title: 'Effective Questioning Techniques for Parents',
        content: `Research-based questioning strategies that promote deep thinking:
        
        1. Open-ended questions: "What do you think about...?" rather than "Is this...?"
        2. Follow-up questions: "Why do you think that?" "What makes you say that?"
        3. Hypothetical questions: "What would happen if...?" "How might things be different if...?"
        4. Comparative questions: "How is this similar to/different from...?"
        5. Metacognitive questions: "How did you figure that out?" "What are you thinking?"
        
        The "Think Time" principle:
        - Wait 3-5 seconds after asking a question
        - Allow children to process and formulate responses
        - Resist the urge to fill silence with more questions
        
        Question stems that promote curiosity:
        - "I wonder what would happen if..."
        - "What do you notice about..."
        - "How might we find out..."
        - "What questions does this raise for you?"`,
        source: 'Walsh, J. A., & Sattes, B. D. (2005). Quality Questioning',
        category: 'education',
        keyTopics: ['open-ended questions', 'wait time', 'metacognition', 'critical thinking'],
        ageRange: [3, 18]
      },
      {
        id: 'family-conversation-research',
        title: 'Building Strong Family Conversations',
        content: `Research on family communication patterns shows that high-quality conversations:
        
        Characteristics of enriching family talk:
        - Turn-taking that includes all family members
        - Elaborative responses that build on each other's ideas
        - Emotional safety where all perspectives are valued
        - Connection to shared experiences and memories
        - Balance of child-led and parent-guided topics
        
        The "HEAR" framework for family conversations:
        - Halt: Stop other activities and give full attention
        - Engage: Show genuine interest through body language and responses
        - Anticipate: Expect unexpected insights and perspectives
        - Respond: Build on what children share rather than redirecting
        
        Benefits of quality family conversations:
        - Stronger family bonds and trust
        - Enhanced language development
        - Better emotional regulation skills
        - Increased sense of belonging and identity`,
        source: 'Hart, B., & Risley, T. R. (1995). Meaningful Differences',
        category: 'family_dynamics',
        keyTopics: ['family communication', 'active listening', 'emotional safety', 'turn-taking'],
        ageRange: [2, 18]
      }
    ]
  }

  /**
   * Generate research-based question suggestions for current conversation context
   */
  generateQuestionSuggestions(query: ResearchQuery): QuestionSuggestion[] {
    const relevantDocs = this.findRelevantDocuments(query)
    const suggestions: QuestionSuggestion[] = []

    for (const doc of relevantDocs) {
      const questionSet = this.extractQuestionsFromDocument(doc, query)
      suggestions.push(...questionSet)
    }

    // Sort by relevance and return top suggestions
    return suggestions
      .sort((a, b) => this.calculateRelevanceScore(b, query) - this.calculateRelevanceScore(a, query))
      .slice(0, 3)
  }

  /**
   * Get contextual guidance for parents based on research
   */
  getParentGuidance(
    childAge: number,
    conversationTopic: string,
    childResponse: string
  ): string {
    const relevantDocs = this.findRelevantDocuments({
      childAge,
      conversationTopic,
      currentContext: childResponse
    })

    if (childAge <= 7 && relevantDocs.some(d => d.id === 'piaget-cognitive-dev')) {
      return `Your child is in Piaget's preoperational stage. They're developing symbolic thinking but may not yet use logical reasoning. Encourage their imaginative explanations and ask "What do you think?" rather than correcting misconceptions directly.`
    }

    if (childAge >= 7 && childAge <= 11) {
      return `At this age, your child can think logically about concrete things. Try asking them to explain their reasoning: "How did you figure that out?" or "What evidence supports that idea?"`
    }

    if (conversationTopic.includes('curiosity') || conversationTopic.includes('wonder')) {
      return `This is a perfect moment to nurture their epistemic curiosity! Follow up with: "What would help us learn more about this?" or "What questions does this raise for you?"`
    }

    return `Keep the conversation flowing by showing genuine interest. Try: "Tell me more about that" or "What makes you think that?"`
  }

  /**
   * Analyze conversation and suggest facilitator interventions
   */
  analyzeFacilitatorOpportunity(
    conversationHistory: string[],
    childAge: number
  ): {
    shouldIntervene: boolean
    intervention: string
    researchBasis: string
  } {
    const recentExchanges = conversationHistory.slice(-4)
    const lastChild = recentExchanges.filter(msg => msg.includes('Child:')).pop()
    const lastParent = recentExchanges.filter(msg => msg.includes('Parent:')).pop()

    // Check for missed opportunities
    if (lastChild && lastChild.includes('?') && (!lastParent || !lastParent.includes('?'))) {
      return {
        shouldIntervene: true,
        intervention: "I noticed a wonderful question there! This might be a perfect moment to explore that curiosity together. What do you both think?",
        researchBasis: "Curiosity research shows that children's questions are windows into their thinking and should be celebrated and explored."
      }
    }

    // Check for one-word responses
    if (lastChild && lastChild.split(' ').length < 3) {
      return {
        shouldIntervene: true,
        intervention: "There seems to be more to discover here. Sometimes asking 'What makes you think that?' can help us understand the fascinating thinking happening.",
        researchBasis: "Vygotsky's research shows that scaffolding questions can help children express their developing thoughts."
      }
    }

    // Check for conversation stalling
    if (recentExchanges.length < 2) {
      return {
        shouldIntervene: true,
        intervention: "This conversation has such rich potential! Sometimes starting with 'I wonder...' can open up new pathways for exploration.",
        researchBasis: "Open-ended questioning techniques promote deeper engagement and sustained dialogue."
      }
    }

    return {
      shouldIntervene: false,
      intervention: "",
      researchBasis: ""
    }
  }

  // Private helper methods
  private findRelevantDocuments(query: ResearchQuery): ResearchDocument[] {
    return this.documents.filter(doc => {
      // Age relevance
      if (doc.ageRange) {
        const [minAge, maxAge] = doc.ageRange
        if (query.childAge < minAge || query.childAge > maxAge) {
          return false
        }
      }

      // Topic relevance
      const topicWords = query.conversationTopic.toLowerCase().split(' ')
      const hasRelevantTopic = doc.keyTopics.some(topic =>
        topicWords.some(word => topic.toLowerCase().includes(word))
      )

      return hasRelevantTopic || doc.category === 'child_development'
    })
  }

  private extractQuestionsFromDocument(doc: ResearchDocument, query: ResearchQuery): QuestionSuggestion[] {
    const suggestions: QuestionSuggestion[] = []

    if (doc.id === 'questioning-techniques') {
      suggestions.push({
        question: `What do you notice about ${query.conversationTopic}?`,
        rationale: 'Open-ended questions promote observation and critical thinking',
        researchSource: doc.source,
        followUpQuestions: [
          'What makes you say that?',
          'How did you figure that out?',
          'What else do you notice?'
        ],
        expectedOutcome: 'Encourages detailed observation and explanation of thinking'
      })
    }

    if (doc.id === 'vygotsky-zpd') {
      suggestions.push({
        question: `How might we find out more about ${query.conversationTopic}?`,
        rationale: 'Scaffolding question that guides toward next steps in learning',
        researchSource: doc.source,
        followUpQuestions: [
          'What tools might help us investigate?',
          'Who could we ask about this?',
          'What would happen if we tried...?'
        ],
        expectedOutcome: 'Develops problem-solving skills and research thinking'
      })
    }

    if (doc.id === 'curiosity-research') {
      suggestions.push({
        question: `What questions does this raise for you about ${query.conversationTopic}?`,
        rationale: 'Taps into epistemic curiosity and information gap theory',
        researchSource: doc.source,
        followUpQuestions: [
          'Which question interests you most?',
          'What would happen if...?',
          'Why do you think that happens?'
        ],
        expectedOutcome: 'Generates new avenues for exploration and sustains curiosity'
      })
    }

    return suggestions
  }

  private calculateRelevanceScore(suggestion: QuestionSuggestion, query: ResearchQuery): number {
    let score = 0
    
    // Boost score for questions that match parent goals
    if (query.parentGoal === 'curiosity' && suggestion.question.includes('wonder')) score += 2
    if (query.parentGoal === 'learning' && suggestion.question.includes('find out')) score += 2
    if (query.parentGoal === 'bonding' && suggestion.question.includes('together')) score += 2
    
    // Boost score for age-appropriate language complexity
    const questionComplexity = suggestion.question.split(' ').length
    if (query.childAge < 8 && questionComplexity < 10) score += 1
    if (query.childAge >= 8 && questionComplexity >= 8) score += 1
    
    return score
  }
}

export const researchEngine = new ResearchEngine()
export type { ResearchQuery, QuestionSuggestion }
