'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAudioRecording } from '@/hooks/useAudioRecording'
import { 
  Mic, 
  MicOff, 
  Lightbulb, 
  MessageCircle, 
  Brain,
  Heart,
  Sparkles,
  Volume2,
  Play,
  Pause,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConversationSuggestion {
  type: 'question' | 'fact' | 'activity' | 'encouragement'
  content: string
  reasoning: string
  urgency: 'low' | 'medium' | 'high'
}

interface RealTimeConversationProps {
  childId: string
  childName: string
  childAge: number
  onConversationComplete: (analysis: any) => void
}

export function RealTimeConversation({ 
  childId, 
  childName, 
  childAge, 
  onConversationComplete 
}: RealTimeConversationProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentSuggestion, setCurrentSuggestion] = useState<ConversationSuggestion | null>(null)
  const [conversationContext, setConversationContext] = useState<string[]>([])
  const [childInterests, setChildInterests] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcriptionBuffer, setTranscriptionBuffer] = useState('')
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    duration,
    audioLevel
  } = useAudioRecording()

  const transcriptionInterval = useRef<NodeJS.Timeout | null>(null)

  // Real-time transcription processing
  useEffect(() => {
    if (isRecording && isActive) {
      // Simulate real-time audio processing with more frequent updates
      transcriptionInterval.current = setInterval(async () => {
        // Simulate transcription chunks (in a real app, this would be from speech recognition)
        const simulatedTranscripts = [
          "Child is asking about the sky and bicycles",
          "Parent is responding to child's questions",
          "Child shows curiosity about colors and sizes",
          "Conversation about nature and animals",
          "Child expressing wonder about how things work"
        ]
        
        const randomTranscript = simulatedTranscripts[Math.floor(Math.random() * simulatedTranscripts.length)]
        setTranscriptionBuffer(randomTranscript)
        
        // Generate suggestion based on simulated content
        await generateRealTimeSuggestion()
      }, 5000) // Check every 5 seconds for more responsive demo
    } else if (transcriptionInterval.current) {
      clearInterval(transcriptionInterval.current)
    }

    return () => {
      if (transcriptionInterval.current) {
        clearInterval(transcriptionInterval.current)
      }
    }
  }, [isRecording, isActive])

  const generateRealTimeSuggestion = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    try {
      const requestData = {
        childId,
        childName,
        childAge,
        conversationContext,
        recentTranscription: transcriptionBuffer || 'Starting conversation...'
      }
      
      console.log('Sending real-time assist request:', requestData)
      
      const response = await fetch('/api/conversations/real-time-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const suggestion = await response.json()
        console.log('Received suggestion:', suggestion)
        setCurrentSuggestion(suggestion)
        
        // Add to conversation context
        if (transcriptionBuffer) {
          setConversationContext(prev => [...prev, transcriptionBuffer].slice(-5))
        }
        setTranscriptionBuffer('')
      } else {
        const errorData = await response.json()
        console.error('API Error:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error generating suggestion:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartConversation = async () => {
    setIsActive(true)
    setCurrentSuggestion({
      type: 'encouragement',
      content: `Great! I'm here to help guide your conversation with ${childName}. I'll suggest questions and activities as we go.`,
      reasoning: 'Initial encouragement to start the conversation',
      urgency: 'medium'
    })
    
    try {
      await startRecording()
      
      // Generate first suggestion after a short delay
      setTimeout(() => {
        generateRealTimeSuggestion()
      }, 3000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsActive(false)
    }
  }

  const handleEndConversation = async () => {
    setIsActive(false)
    
    try {
      await stopRecording()
    } catch (error) {
      console.error('Failed to stop recording:', error)
    }

    // Send conversation data directly to API
    try {
      const conversationText = conversationContext.join('\n')
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          title: 'Real-time AI Guided Conversation',
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

  const dismissSuggestion = () => {
    setCurrentSuggestion(null)
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'question': return <MessageCircle className="h-4 w-4" />
      case 'fact': return <Brain className="h-4 w-4" />
      case 'activity': return <Sparkles className="h-4 w-4" />
      case 'encouragement': return <Heart className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const getSuggestionColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 border-red-200 text-red-800'
      case 'medium': return 'bg-yellow-100 border-yellow-200 text-yellow-800'
      case 'low': return 'bg-blue-100 border-blue-200 text-blue-800'
      default: return 'bg-gray-100 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" />
            Real-Time Conversation with {childName}
          </CardTitle>
          <CardDescription>
            AI-powered conversation mediation to enhance learning and curiosity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isActive ? (
            <Button 
              onClick={handleStartConversation}
              className="w-full"
              size="lg"
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Guided Conversation
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Recording Status */}
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full animate-pulse",
                      isRecording ? "bg-red-500" : "bg-gray-400"
                    )} />
                    <span className="font-medium text-green-800">
                      {isRecording ? 'Recording...' : 'Paused'}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                  </Badge>
                </div>
                
                {/* Audio Level Indicator */}
                {isRecording && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-1 h-4 bg-green-400 rounded-full transition-opacity",
                          audioLevel > (i * 20) ? "opacity-100" : "opacity-20"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={generateRealTimeSuggestion}
                  disabled={isProcessing}
                  variant="outline"
                  size="sm"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Getting...' : 'Get Suggestion'}
                </Button>
                <Button 
                  onClick={handleEndConversation}
                  variant="outline"
                  size="sm"
                >
                  <MicOff className="h-4 w-4 mr-2" />
                  End
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Suggestions */}
      {currentSuggestion && (
        <Card className={cn("border-l-4", getSuggestionColor(currentSuggestion.urgency))}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSuggestionIcon(currentSuggestion.type)}
                <CardTitle className="text-sm font-medium">
                  AI Suggestion
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {currentSuggestion.type}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={dismissSuggestion}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium text-neutral-900 mb-2">
              {currentSuggestion.content}
            </p>
            <p className="text-xs text-neutral-600">
              <strong>Why:</strong> {currentSuggestion.reasoning}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conversation Context */}
      {conversationContext.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conversation Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conversationContext.map((context, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded border-l-2 border-primary-200">
                  {context.substring(0, 100)}...
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-gradient-to-r from-secondary-50 to-primary-50 border-secondary-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-neutral-900 mb-2">💡 Real-Time Conversation Tips</h3>
          <div className="space-y-1 text-xs text-neutral-700">
            <p><strong>Follow AI suggestions:</strong> The system analyzes patterns in real-time</p>
            <p><strong>Build on interests:</strong> Notice what excites your child most</p>
            <p><strong>Ask "why" and "how":</strong> These develop deeper thinking</p>
            <p><strong>Stay curious yourself:</strong> Model the behavior you want to see</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
