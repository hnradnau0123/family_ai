'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Users, 
  BookOpen,
  Lightbulb,
  Brain,
  Heart,
  Settings
} from 'lucide-react'
import { voiceService, VoiceDetectionResult } from '@/lib/voice-service'
import { researchEngine, QuestionSuggestion } from '@/lib/research-engine'

interface ConversationTurn {
  id: string
  speaker: 'parent' | 'child' | 'facilitator'
  content: string
  timestamp: Date
  confidence?: number
  voiceCharacteristics?: VoiceDetectionResult
}

interface AdvancedAIFacilitatorProps {
  childId: string
  childName: string
  childAge: number
  onConversationEnd: (turns: ConversationTurn[]) => void
}

export default function AdvancedAIFacilitator({
  childId,
  childName,
  childAge,
  onConversationEnd
}: AdvancedAIFacilitatorProps) {
  // Core state
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([])
  const [currentTopic, setCurrentTopic] = useState<string>('')
  
  // AI state
  const [facilitatorMode, setFacilitatorMode] = useState<'observer' | 'active' | 'research_guided'>('observer')
  const [lastSpeaker, setLastSpeaker] = useState<'parent' | 'child' | null>(null)
  const [questionSuggestions, setQuestionSuggestions] = useState<QuestionSuggestion[]>([])
  const [interventionOpportunity, setInterventionOpportunity] = useState<string | null>(null)
  
  // Technical refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const interventionTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'
      
      recognition.onresult = handleSpeechResult
      recognition.onerror = handleSpeechError
      recognition.onend = handleSpeechEnd
      
      recognitionRef.current = recognition
    }
  }, [])

  const handleSpeechResult = useCallback(async (event: any) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim()
    if (transcript.length < 3) return

    try {
      // Analyze voice characteristics to detect speaker
      const audioContext = new AudioContext()
      const voiceDetection = await analyzeVoiceCharacteristics(transcript)
      
      const turn: ConversationTurn = {
        id: Date.now().toString(),
        speaker: voiceDetection.speakerType,
        content: transcript,
        timestamp: new Date(),
        confidence: voiceDetection.confidence,
        voiceCharacteristics: voiceDetection
      }

      setConversationTurns(prev => [...prev, turn])
      setLastSpeaker(voiceDetection.speakerType)
      
      // Update conversation topic analysis
      updateConversationTopic(transcript)
      
      // Check for facilitator intervention opportunity
      checkInterventionOpportunity([...conversationTurns, turn])
      
      // Generate research-based suggestions
      if (voiceDetection.speakerType === 'child') {
        generateResearchSuggestions(transcript)
      }
      
    } catch (error) {
      console.error('Voice analysis error:', error)
    }
  }, [conversationTurns])

  const handleSpeechError = useCallback((event: any) => {
    console.error('Speech recognition error:', event.error)
    if (isListening) {
      // Restart recognition after error
      setTimeout(() => {
        if (recognitionRef.current && isActive) {
          recognitionRef.current.start()
        }
      }, 1000)
    }
  }, [isListening, isActive])

  const handleSpeechEnd = useCallback(() => {
    if (isActive && isListening) {
      // Restart continuous listening
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.start()
        }
      }, 100)
    }
  }, [isActive, isListening])

  const startFacilitating = async () => {
    setIsActive(true)
    setIsListening(true)
    
    if (recognitionRef.current) {
      recognitionRef.current.start()
    }
    
    // Welcome message
    await speakFacilitatorMessage(
      `Hello ${childName} and family! I'm here to help make your conversation even more wonderful. I'll listen quietly and occasionally offer gentle suggestions to help you explore ideas together.`,
      'welcoming'
    )
  }

  const stopFacilitating = () => {
    setIsActive(false)
    setIsListening(false)
    
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
    
    if (interventionTimerRef.current) {
      clearTimeout(interventionTimerRef.current)
    }
    
    // Send conversation data to parent component
    onConversationEnd(conversationTurns)
  }

  const speakFacilitatorMessage = async (
    message: string, 
    tone: 'encouraging' | 'curious' | 'supportive' | 'welcoming' = 'supportive'
  ) => {
    if (isSpeaking) return
    
    setIsSpeaking(true)
    
    try {
      const audioBuffer = await voiceService.generateSpeech(message, {
        speakerType: lastSpeaker || 'parent',
        emotionalTone: tone,
        childAge
      })
      
      if (audioBuffer) {
        await voiceService.playAudio(audioBuffer, () => {
          setIsSpeaking(false)
        })
      } else {
        setIsSpeaking(false)
      }
      
      // Add facilitator turn to conversation
      const facilitatorTurn: ConversationTurn = {
        id: Date.now().toString(),
        speaker: 'facilitator',
        content: message,
        timestamp: new Date()
      }
      
      setConversationTurns(prev => [...prev, facilitatorTurn])
      
    } catch (error) {
      console.error('Facilitator speech error:', error)
      setIsSpeaking(false)
    }
  }

  const analyzeVoiceCharacteristics = async (transcript: string): Promise<VoiceDetectionResult> => {
    // For now, use content analysis to determine speaker type
    // In production, you'd analyze actual audio characteristics
    
    const childIndicators = [
      transcript.length < 50, // Shorter responses
      /\b(wow|cool|awesome|amazing)\b/i.test(transcript),
      /\b(I think|maybe|probably)\b/i.test(transcript),
      /\?/.test(transcript) // Questions are common in children
    ]
    
    const parentIndicators = [
      transcript.length > 100, // Longer explanations
      /\b(because|however|therefore|actually)\b/i.test(transcript),
      /\b(let's|we should|you could)\b/i.test(transcript)
    ]
    
    const childScore = childIndicators.filter(Boolean).length
    const parentScore = parentIndicators.filter(Boolean).length
    
    if (childScore > parentScore) {
      return {
        speakerType: 'child',
        confidence: 0.7,
        ageEstimate: childAge
      }
    } else if (parentScore > childScore) {
      return {
        speakerType: 'parent',
        confidence: 0.8
      }
    } else {
      return {
        speakerType: 'unknown',
        confidence: 0.5
      }
    }
  }

  const updateConversationTopic = (transcript: string) => {
    // Extract key topics from recent conversation
    const recentTranscripts = conversationTurns
      .slice(-5)
      .map(turn => turn.content)
      .concat(transcript)
      .join(' ')
    
    // Simple topic extraction (in production, use more sophisticated NLP)
    const topics = recentTranscripts
      .toLowerCase()
      .match(/\b(science|nature|animals|space|art|music|books|friends|school|family|toys|games|food|sports)\b/g)
    
    if (topics && topics.length > 0) {
      const primaryTopic = topics[0]
      setCurrentTopic(primaryTopic)
    }
  }

  const checkInterventionOpportunity = (turns: ConversationTurn[]) => {
    const conversationHistory = turns.map(turn => `${turn.speaker}: ${turn.content}`)
    
    const analysis = researchEngine.analyzeFacilitatorOpportunity(
      conversationHistory,
      childAge
    )
    
    if (analysis.shouldIntervene && facilitatorMode !== 'observer') {
      setInterventionOpportunity(analysis.intervention)
      
      // Auto-intervene after delay if in active mode
      if (facilitatorMode === 'active') {
        interventionTimerRef.current = setTimeout(() => {
          speakFacilitatorMessage(analysis.intervention, 'supportive')
          setInterventionOpportunity(null)
        }, 3000)
      }
    }
  }

  const generateResearchSuggestions = (childResponse: string) => {
    if (!currentTopic) return
    
    const suggestions = researchEngine.generateQuestionSuggestions({
      childAge,
      conversationTopic: currentTopic,
      parentGoal: 'curiosity',
      currentContext: childResponse
    })
    
    setQuestionSuggestions(suggestions)
  }

  const manualIntervention = () => {
    if (interventionOpportunity) {
      speakFacilitatorMessage(interventionOpportunity, 'supportive')
      setInterventionOpportunity(null)
    }
  }

  const useSuggestion = (suggestion: QuestionSuggestion) => {
    const guidanceMessage = researchEngine.getParentGuidance(
      childAge,
      currentTopic,
      conversationTurns[conversationTurns.length - 1]?.content || ''
    )
    
    speakFacilitatorMessage(
      `This might be a wonderful moment to explore: ${suggestion.question}. ${guidanceMessage}`,
      'curious'
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary-600" />
                Advanced AI Facilitator
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Intelligent conversation guidance powered by research and voice analysis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
              {isListening && (
                <Badge variant="outline" className="animate-pulse">
                  <Mic className="h-3 w-3 mr-1" />
                  Listening
                </Badge>
              )}
              {isSpeaking && (
                <Badge variant="outline" className="animate-pulse">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Speaking
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Facilitator Mode Selection */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={facilitatorMode === 'observer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFacilitatorMode('observer')}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Observer
            </Button>
            <Button
              variant={facilitatorMode === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFacilitatorMode('active')}
            >
              <Users className="h-4 w-4 mr-1" />
              Active Guide
            </Button>
            <Button
              variant={facilitatorMode === 'research_guided' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFacilitatorMode('research_guided')}
            >
              <Brain className="h-4 w-4 mr-1" />
              Research-Guided
            </Button>
          </div>

          {/* Main Controls */}
          <div className="flex gap-4">
            {!isActive ? (
              <Button onClick={startFacilitating} className="flex-1">
                <Mic className="h-4 w-4 mr-2" />
                Start AI Facilitation
              </Button>
            ) : (
              <Button onClick={stopFacilitating} variant="destructive" className="flex-1">
                <MicOff className="h-4 w-4 mr-2" />
                End Session
              </Button>
            )}
          </div>

          {/* Current Status */}
          {isActive && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Session Info:</span>
                <span>{conversationTurns.length} turns recorded</span>
              </div>
              {currentTopic && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Current Topic:</span>
                  <Badge variant="secondary">{currentTopic}</Badge>
                </div>
              )}
              {lastSpeaker && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Last Speaker:</span>
                  <Badge variant="outline">{lastSpeaker}</Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Intervention Opportunities */}
      {interventionOpportunity && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Lightbulb className="h-5 w-5" />
              Intervention Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-3">{interventionOpportunity}</p>
            <Button onClick={manualIntervention} size="sm">
              <Volume2 className="h-4 w-4 mr-2" />
              Speak This Guidance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Research-Based Suggestions */}
      {questionSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary-600" />
              Research-Based Question Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questionSuggestions.map((suggestion, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{suggestion.question}</p>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.rationale}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Research basis: {suggestion.researchSource}
                    </p>
                  </div>
                  <Button onClick={() => useSuggestion(suggestion)} size="sm" variant="outline">
                    Use This
                  </Button>
                </div>
                {suggestion.followUpQuestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700">Follow-up questions:</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      {suggestion.followUpQuestions.map((followUp, idx) => (
                        <li key={idx}>• {followUp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Conversation History */}
      {conversationTurns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary-600" />
              Conversation Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {conversationTurns.slice(-10).map((turn) => (
                <div key={turn.id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Badge 
                      variant={turn.speaker === 'facilitator' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {turn.speaker}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{turn.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {turn.timestamp.toLocaleTimeString()}
                      </span>
                      {turn.confidence && (
                        <span className="text-xs text-gray-500">
                          Confidence: {Math.round(turn.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
