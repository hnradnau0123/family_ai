// Demo configuration for public deployment
export const isDemoMode = process.env.OPENAI_API_KEY === 'demo-mode' || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('PLEASE_ADD')

export const demoConfig = {
  // Demo conversation starters when OpenAI is not available
  conversationStarters: [
    "What made you smile today?",
    "If you could have any superpower, what would it be and why?",
    "What's the most interesting thing you learned recently?",
    "Tell me about something that made you curious today.",
    "If you could visit any place in the world, where would you go?",
    "What's your favorite way to spend time with family?",
    "What would you like to invent to make the world better?",
    "What's something new you'd like to try or learn?",
    "Tell me about a time when you helped someone.",
    "What makes you feel proud of yourself?"
  ],
  
  // Demo insights when AI analysis is not available
  demoInsights: [
    {
      type: 'CURIOSITY_PATTERN',
      category: 'Learning Style',
      title: 'Visual Learning Preference',
      description: 'Shows strong interest in visual explanations and demonstrations',
      confidence: 0.85
    },
    {
      type: 'INTEREST_AREA',
      category: 'Science',
      title: 'Natural World Explorer',
      description: 'Demonstrates fascination with animals, plants, and natural phenomena',
      confidence: 0.90
    },
    {
      type: 'SOCIAL_SKILL',
      category: 'Communication',
      title: 'Thoughtful Questioner',
      description: 'Asks meaningful questions and listens carefully to responses',
      confidence: 0.75
    }
  ],
  
  // Demo recommendations
  demoRecommendations: {
    content: {
      music: [
        { title: "Nature Sounds Collection", artist: "Various", reason: "Supports curiosity about natural world" },
        { title: "Science Songs for Kids", artist: "Educational Music", reason: "Makes learning fun and memorable" }
      ],
      movies: [
        { title: "March of the Penguins", genre: "Documentary", reason: "Perfect for nature enthusiasts" },
        { title: "Inside Out", genre: "Animation", reason: "Helps understand emotions and feelings" }
      ],
      shows: [
        { title: "Bluey", genre: "Family", reason: "Great family bonding and imaginative play" },
        { title: "Octonauts", genre: "Educational", reason: "Ocean exploration and teamwork" }
      ]
    },
    activities: {
      hobbies: [
        { name: "Nature Journaling", difficulty: "Beginner", reason: "Perfect for observant learners" },
        { name: "Science Experiments", difficulty: "Intermediate", reason: "Hands-on learning approach" }
      ],
      lessons: [
        { name: "Art Classes", type: "Creative", reason: "Develops visual expression skills" },
        { name: "Nature Club", type: "Outdoor", reason: "Explores natural world interests" }
      ],
      events: [
        { name: "Science Museum Visit", location: "Local", reason: "Interactive learning experience" },
        { name: "Nature Walk", location: "Park", reason: "Real-world observation opportunities" }
      ]
    }
  }
}

export function getDemoConversationStarter(): string {
  const starters = demoConfig.conversationStarters
  return starters[Math.floor(Math.random() * starters.length)]
}
