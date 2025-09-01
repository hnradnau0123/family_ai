import { Child, Conversation, Insight, Recommendation, User } from '@prisma/client'

export type ChildWithConversations = Child & {
  conversations: Conversation[]
  insights: Insight[]
  recommendations: Recommendation[]
}

export type UserWithChildren = User & {
  children: ChildWithConversations[]
}

export interface ConversationStarter {
  id: string
  text: string
  category: string
  ageGroup: string
}

export interface DashboardStats {
  totalConversations: number
  totalInsights: number
  weeklyConversations: number
  topInterests: string[]
}

export interface InsightSummary {
  curiosityLevel: number
  topStrengths: string[]
  recentInterests: string[]
  recommendedActivities: string[]
}

export interface AudioRecording {
  blob: Blob
  duration: number
  url: string
}
