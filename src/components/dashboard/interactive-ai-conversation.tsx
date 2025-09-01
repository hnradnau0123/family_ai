'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAudioRecording } from '@/hooks/useAudioRecording'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Brain,
  Heart,
  Sparkles,
  Users,
  MessageCircle,
  Play,
  Pause,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIResponse {
  type: 'follow_up' | 'theme_suggestion' | 'parent_guidance' | 'encouragement'
  content: string
  parentGuidance?: string
  reasoning: string
  urgency: 'low' | 'medium' | 'high'
  shouldSpeak: boolean
  isForParent: boolean
}

interface InteractiveAIConversationProps {
  childId: string
  childName: string
  childAge: number
  onConversationComplete?: (audioBlob: Blob, duration: number) => void
}

export function InteractiveAIConversation({ 
  childId, 
  childName, 
  childAge, 
  onConversationComplete 
}: InteractiveAIConversationProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentAIResponse, setCurrentAIResponse] = useState<AIResponse | null>(null)
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [aiVolume, setAiVolume] = useState(true)
  const [conversationPhase, setConversationPhase] = useState<'intro' | 'active' | 'deeper' | 'wrap'>('intro')
  const [childInteractionCount, setChildInteractionCount] = useState(0)
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    duration,
    audioLevel
  } = useAudioRecording()

  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const interactionInterval = useRef<NodeJS.Timeout | null>(null)

  // AI interaction patterns based on conversation phase
  const getInteractionTiming = () => {
    switch (conversationPhase) {
      case 'intro': return 8000  // 8 seconds - give time for parent/child to start
      case 'active': return 12000 // 12 seconds - let conversation flow
      case 'deeper': return 15000 // 15 seconds - longer pauses for deeper thinking
      case 'wrap': return 20000   // 20 seconds - sparse interventions
      default: return 10000
    }
  }

  // Real-time AI participation
  useEffect(() => {
    if (isRecording && isActive) {
      const startNextInteraction = () => {
        const timing = getInteractionTiming()
        interactionInterval.current = setTimeout(async () => {
          await generateAIInteraction()
          startNextInteraction() // Schedule next interaction
        }, timing)
      }
      
      startNextInteraction()
    } else if (interactionInterval.current) {
      clearTimeout(interactionInterval.current)
    }

    return () => {
      if (interactionInterval.current) {
        clearTimeout(interactionInterval.current)
      }
    }
  }, [isRecording, isActive, conversationPhase])

  const generateAIInteraction = async () => {
    try {
      const response = await fetch('/api/conversations/interactive-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          childName,
          childAge,
          conversationHistory,
          conversationPhase,
          childInteractionCount
        })
      })

      if (response.ok) {
        const aiResponse: AIResponse = await response.json()
        setCurrentAIResponse(aiResponse)
        
        // Update conversation phase based on interaction count
        setChildInteractionCount(prev => prev + 1)
        updateConversationPhase()
        
        // Add to conversation history
        setConversationHistory(prev => [...prev, `AI: ${aiResponse.content}`].slice(-10))
        
        // Speak the response if enabled
        if (aiResponse.shouldSpeak && aiVolume) {
          speakAIResponse(aiResponse.content)
        }
      }
    } catch (error) {
      console.error('Error generating AI interaction:', error)
    }
  }

  const updateConversationPhase = () => {
    if (childInteractionCount < 2) {
      setConversationPhase('intro')
    } else if (childInteractionCount < 5) {
      setConversationPhase('active')
    } else if (childInteractionCount < 8) {
      setConversationPhase('deeper')
    } else {
      setConversationPhase('wrap')
    }
  }

  const speakAIResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.1
      utterance.volume = 0.8
      
      utterance.onstart = () => setIsAISpeaking(true)
      utterance.onend = () => setIsAISpeaking(false)
      utterance.onerror = () => setIsAISpeaking(false)
      
      speechSynthesisRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleStartConversation = async () => {
    setIsActive(true)
    setConversationPhase('intro')
    setChildInteractionCount(0)
    
    // Welcome message
    const welcomeMessage = `Hi ${childName}! I'm your AI conversation friend. I love asking questions and learning about the world with you. What are you curious about today?`
    
    setCurrentAIResponse({
      type: 'encouragement',
      content: welcomeMessage,
      reasoning: 'Welcome and invitation to share curiosity',
      urgency: 'high',
      shouldSpeak: true
    })
    
    if (aiVolume) {
      speakAIResponse(welcomeMessage)
    }
    
    try {
      await startRecording()
    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsActive(false)
    }
  }

  const handleEndConversation = async () => {
    setIsActive(false)
    
    // Stop any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    
    // Farewell message
    const farewellMessage = `That was such a fun conversation, ${childName}! You asked amazing questions. Keep being curious!`
    if (aiVolume) {
      speakAIResponse(farewellMessage)
    }
    
    try {
      await stopRecording()
    } catch (error) {
      console.error('Failed to stop recording:', error)
    }

    // Send conversation data directly to API
    try {
      const conversationText = conversationHistory.join('\n')
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          title: 'Interactive AI Conversation',
          transcription: conversationText,
          duration: duration
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Navigate to the conversation details page
        window.location.href = `/dashboard/conversations/${data.conversation.id}`
      } else {
        const error = await response.json()
        console.error('Failed to save conversation:', error)
        alert('Failed to save conversation: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving conversation:', error)
      alert('Failed to save conversation')
    }
  }

  const toggleAIVolume = () => {
    setAiVolume(!aiVolume)
    if (!aiVolume && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsAISpeaking(false)
    }
  }

  const forceAIInteraction = () => {
    generateAIInteraction()
  }

  const getResponseIcon = (type: string) => {
    switch (type) {
      case 'question': return <MessageCircle className="h-4 w-4" />
      case 'fact': return <Brain className="h-4 w-4" />
      case 'encouragement': return <Heart className="h-4 w-4" />
      case 'challenge': return <Zap className="h-4 w-4" />
      case 'wonder': return <Sparkles className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  const getResponseColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-purple-100 border-purple-200 text-purple-800'
      case 'medium': return 'bg-blue-100 border-blue-200 text-blue-800'
      case 'low': return 'bg-green-100 border-green-200 text-green-800'
      default: return 'bg-gray-100 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Interactive AI Conversation with {childName}
          </CardTitle>
          <CardDescription>
            AI actively participates in the conversation - asking questions, sharing facts, and encouraging curiosity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isActive ? (
            <div className="space-y-4">
              <Button 
                onClick={handleStartConversation}
                className="w-full"
                size="lg"
              >
                <Brain className="h-5 w-5 mr-2" />
                Start Interactive Conversation
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <span>AI will speak and participate in the conversation</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Voice Enabled
                </Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recording Status */}
              <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      isRecording ? "bg-red-500 animate-pulse" : "bg-gray-400"
                    )} />
                    <span className="font-medium text-purple-800">
                      {isRecording ? 'AI Conversation Active' : 'Paused'}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-purple-700 border-purple-300">
                    Phase: {conversationPhase}
                  </Badge>
                  <Badge variant="outline" className="text-purple-700 border-purple-300">
                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                  </Badge>
                </div>
                
                {/* AI Speaking Indicator */}
                {isAISpeaking && (
                  <div className="flex items-center gap-2 text-purple-700">
                    <Volume2 className="h-4 w-4 animate-pulse" />
                    <span className="text-sm font-medium">AI Speaking...</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={toggleAIVolume}
                  variant="outline"
                  size="sm"
                  className={aiVolume ? 'bg-purple-50 border-purple-200' : ''}
                >
                  {aiVolume ? <Volume2 className="h-4 w-4 mr-1" /> : <VolumeX className="h-4 w-4 mr-1" />}
                  {aiVolume ? 'On' : 'Off'}
                </Button>
                
                <Button 
                  onClick={forceAIInteraction}
                  variant="outline"
                  size="sm"
                >
                  <Brain className="h-4 w-4 mr-1" />
                  AI Jump In
                </Button>
                
                <Button 
                  onClick={handleEndConversation}
                  variant="outline"
                  size="sm"
                >
                  <MicOff className="h-4 w-4 mr-1" />
                  End
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current AI Response */}
      {currentAIResponse && (
        <Card className={cn("border-l-4", getResponseColor(currentAIResponse.urgency))}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getResponseIcon(currentAIResponse.type)}
                <CardTitle className="text-sm font-medium">
                  AI {isAISpeaking ? '🗣️ Speaking' : '💭 Says'}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {currentAIResponse.type}
                </Badge>
              </div>
              {currentAIResponse.shouldSpeak && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => speakAIResponse(currentAIResponse.content)}
                  className="h-6 px-2"
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium text-neutral-900 mb-2">
              {currentAIResponse.content}
            </p>
            <p className="text-xs text-neutral-600">
              <strong>AI Strategy:</strong> {currentAIResponse.reasoning}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conversation Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {conversationHistory.slice(-5).map((entry, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded border-l-2 border-purple-200">
                  {entry}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Tips */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-neutral-900 mb-2">🤖 Interactive AI Features</h3>
          <div className="space-y-1 text-xs text-neutral-700">
            <p><strong>Voice Participation:</strong> AI speaks directly to your child</p>
            <p><strong>Smart Timing:</strong> AI knows when to jump in or stay quiet</p>
            <p><strong>Adaptive Questions:</strong> Gets more complex as conversation develops</p>
            <p><strong>Curiosity Amplifier:</strong> Builds on your child's interests in real-time</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
