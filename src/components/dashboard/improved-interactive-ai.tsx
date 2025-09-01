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
  Settings,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIResponse {
  type: 'follow_up' | 'theme_suggestion' | 'parent_guidance' | 'encouragement'
  content: string
  parentGuidance?: string
  reasoning: string
  isForParent: boolean
}

interface ImprovedInteractiveAIProps {
  childId: string
  childName: string
  childAge: number
}

export function ImprovedInteractiveAI({ 
  childId, 
  childName, 
  childAge
}: ImprovedInteractiveAIProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentSuggestion, setCurrentSuggestion] = useState<AIResponse | null>(null)
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [aiVolume, setAiVolume] = useState(true)
  const [conversationTheme, setConversationTheme] = useState<string>('')
  const [duration, setDuration] = useState(0)
  const [selectedVoice, setSelectedVoice] = useState<(SpeechSynthesisVoice & { character?: string; description?: string; ageRecommendation?: string; uniqueId?: string }) | null>(null)
  const [availableVoices, setAvailableVoices] = useState<(SpeechSynthesisVoice & { character?: string; description?: string; ageRecommendation?: string; uniqueId?: string })[]>([])
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [recentTranscription, setRecentTranscription] = useState<string>('')
  const [isListening, setIsListening] = useState(false)
  const [lastProcessedSpeech, setLastProcessedSpeech] = useState<string>('')
  
  const { startRecording, stopRecording, isRecording } = useAudioRecording()
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const suggestionInterval = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize speech synthesis and find character-based, Disney-like voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        
        // Check if voices are available
        if (!voices || voices.length === 0) {
          console.warn('No speech synthesis voices available')
          return
        }
        
        // Create character-based voice categories with Disney-like descriptions
        const characterVoices = voices.filter(voice => {
          const name = voice.name?.toLowerCase() || ''
          const lang = voice.lang?.toLowerCase() || ''
          
          return lang.includes('en') && voice.name
        }).map((voice, index) => {
          const name = voice.name.toLowerCase()
          
          // Assign character types based on voice characteristics and child age
          let character = 'Friendly Helper'
          let description = 'A warm, friendly voice'
          let ageRecommendation = ''
          
          if (name.includes('zira') || name.includes('hazel')) {
            character = 'Fairy Godmother'
            description = 'Magical and wise, like a Disney fairy ✨'
            ageRecommendation = childAge <= 7 ? 'Perfect for your age!' : 'Great for magical moments'
          } else if (name.includes('samantha') || name.includes('victoria')) {
            character = 'Princess Guide'
            description = 'Gentle and caring, like a Disney princess 👸'
            ageRecommendation = childAge <= 8 ? 'Perfect for your age!' : 'Sweet and gentle'
          } else if (name.includes('karen') || name.includes('susan')) {
            character = 'Cheerful Teacher'
            description = 'Bright and encouraging, like a kids TV show host 📺'
            ageRecommendation = childAge >= 4 ? 'Perfect for your age!' : 'Fun and educational'
          } else if (name.includes('alex') || name.includes('daniel')) {
            character = 'Wise Narrator'
            description = 'Storytelling voice, like a Disney movie narrator 📚'
            ageRecommendation = childAge >= 6 ? 'Perfect for your age!' : 'Great for stories'
          } else if (name.includes('google') && name.includes('female')) {
            character = 'Curious Explorer'
            description = 'Adventurous and fun, like animated adventure shows 🗺️'
            ageRecommendation = childAge >= 3 ? 'Perfect for your age!' : 'Very animated'
          } else if (name.includes('enhanced') || name.includes('premium') || name.includes('neural')) {
            character = 'Magic Friend'
            description = 'Special animated voice with extra personality ✨'
            ageRecommendation = 'High quality voice!'
          } else if (name.includes('male') || voice.name.includes('Male')) {
            character = 'Friendly Guide'
            description = 'Like a caring cartoon character or fun teacher 🤗'
            ageRecommendation = childAge >= 5 ? 'Perfect for your age!' : 'Friendly helper'
          } else {
            // Female voices get more character-based descriptions based on age
            if (childAge <= 5) {
              character = 'Animated Friend'
              description = 'Very playful and bubbly, like cartoon characters 🎭'
              ageRecommendation = 'Perfect for little ones!'
            } else if (childAge <= 8) {
              character = 'Story Companion'
              description = 'Perfect for adventures and bedtime stories 📖'
              ageRecommendation = 'Great for your age!'
            } else {
              character = 'Friendly Companion'
              description = 'Warm and encouraging, like your favorite cartoon friend 🌟'
              ageRecommendation = 'Age-appropriate choice'
            }
          }
          
          return {
            ...voice,
            character,
            description,
            ageRecommendation,
            uniqueId: `${voice.name}-${voice.lang}-${index}`
          }
        })
        
        // Sort voices by character appeal for kids
        const sortedVoices = characterVoices.sort((a, b) => {
          const aScore = getCharacterScore(a.name?.toLowerCase() || '')
          const bScore = getCharacterScore(b.name?.toLowerCase() || '')
          return bScore - aScore
        })
        
        setAvailableVoices(sortedVoices.slice(0, 12)) // Limit to best 12 voices
        
        // Set default to the most character-like voice
        if (sortedVoices.length > 0) {
          setSelectedVoice(sortedVoices[0])
        }
      }

      // Score voices based on kid-friendly character potential and age appropriateness
      const getCharacterScore = (name: string) => {
        let score = 0
        
        // Base character scores
        if (name.includes('zira')) score += 10 // Very character-like
        if (name.includes('hazel')) score += 9
        if (name.includes('samantha')) score += 8
        if (name.includes('karen')) score += 7
        if (name.includes('victoria')) score += 6
        if (name.includes('google') && name.includes('female')) score += 8
        if (name.includes('enhanced') || name.includes('premium') || name.includes('neural')) score += 6
        if (name.includes('female') || name.includes('girl')) score += 4
        if (name.includes('young')) score += 6
        if (name.includes('default')) score -= 2 // Prefer non-default voices
        
        // Age-specific bonus scoring
        if (childAge <= 4) {
          // Toddlers prefer very animated, high-pitched voices
          if (name.includes('zira') || name.includes('karen')) score += 5
          if (name.includes('female')) score += 3
        } else if (childAge <= 7) {
          // Preschool/early elementary prefer character voices
          if (name.includes('samantha') || name.includes('victoria') || name.includes('zira')) score += 4
          if (name.includes('google') && name.includes('female')) score += 3
        } else if (childAge <= 10) {
          // Elementary prefer clear, friendly voices
          if (name.includes('karen') || name.includes('susan')) score += 3
          if (name.includes('enhanced') || name.includes('premium')) score += 2
        }
        
        // Penalty for very robotic or adult-sounding names
        if (name.includes('microsoft') && !name.includes('zira')) score -= 1
        if (name.includes('system') || name.includes('default')) score -= 3
        if (name.includes('robot') || name.includes('synthetic')) score -= 5
        
        return score
      }

      if (window.speechSynthesis.getVoices().length > 0) {
        updateVoices()
      } else {
        window.speechSynthesis.onvoiceschanged = updateVoices
        // Fallback: Try again after a short delay
        setTimeout(() => {
          if (window.speechSynthesis.getVoices().length > 0) {
            updateVoices()
          }
        }, 1000)
      }
    }
  }, [])

  // Initialize speech recognition for real-time conversation
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      recognition.onstart = () => {
        console.log('Speech recognition started')
        setIsListening(true)
      }
      
      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript && finalTranscript.trim().length > 0) {
          const newTranscript = finalTranscript.trim()
          console.log('Recognized speech:', newTranscript)
          
          // Add to conversation history
          addToHistory(`Human: ${newTranscript}`)
          setRecentTranscription(newTranscript)
          setLastProcessedSpeech(newTranscript)
          
          // Process the speech and potentially respond
          handleSpeechInput(newTranscript)
        }
      }
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'no-speech') {
          // Restart recognition if no speech detected
          setTimeout(() => {
            if (isActive && recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch (err) {
                console.warn('Could not restart recognition:', err)
              }
            }
          }, 1000)
        }
      }
      
      recognition.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)
        
        // Restart recognition if conversation is still active
        if (isActive) {
          setTimeout(() => {
            if (recognitionRef.current && isActive) {
              try {
                recognitionRef.current.start()
              } catch (err) {
                console.warn('Could not restart recognition:', err)
              }
            }
          }, 100)
        }
      }
    } else {
      console.warn('Speech recognition not supported in this browser')
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (err) {
          console.warn('Error stopping recognition:', err)
        }
      }
    }
  }, [isActive])

  // Handle speech input and provide family facilitation
  const handleSpeechInput = async (transcript: string) => {
    console.log('🎤 Speech heard:', transcript)
    
    // Clear any existing timeout
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
    }
    
    // Add to conversation history
    addToHistory(`Voice: ${transcript}`)
    
    // Determine who spoke (improved heuristics)
    const lowerTranscript = transcript.toLowerCase()
    
    // Parent indicators
    const isLikelyParent = lowerTranscript.includes('suggestion') ||
                          lowerTranscript.includes('help') ||
                          lowerTranscript.includes('what should i') ||
                          lowerTranscript.includes('how do i') ||
                          lowerTranscript.includes('guidance') ||
                          lowerTranscript.includes('advice') ||
                          transcript.length > 80
    
    // Child indicators  
    const isLikelyChild = !isLikelyParent && (
                         lowerTranscript.includes('i want') ||
                         lowerTranscript.includes('can we') ||
                         lowerTranscript.includes('why') ||
                         lowerTranscript.includes('what') ||
                         lowerTranscript.includes('how') ||
                         lowerTranscript.includes('i like') ||
                         lowerTranscript.includes('i saw') ||
                         transcript.length < 30
                         )
    
    console.log('🎯 Detected speaker:', isLikelyChild ? 'Child' : isLikelyParent ? 'Parent' : 'Unknown')
    
    // Reduce timeout for more responsive facilitation
    speechTimeoutRef.current = setTimeout(async () => {
      try {
        if (isLikelyChild) {
          console.log('👶 Generating parent guidance for child speech...')
          await generateParentGuidance(transcript)
        } else {
          console.log('👨‍👩‍👧 Generating follow-up suggestion for parent/general speech...')
          await generateFollowUpSuggestion(transcript)
        }
      } catch (error) {
        console.error('❌ Error in speech handling:', error)
        // Provide immediate fallback guidance
        setCurrentSuggestion({
          type: 'parent_guidance',
          content: `Great question! Try asking ${childName}: "What do you think about that?" to keep them engaged.`,
          reasoning: 'Encouraging continued dialogue',
          isForParent: true
        })
      }
    }, 1500) // Reduced to 1.5 seconds for more responsive facilitation
  }

  // Generate guidance for parent on how to respond to child
  const generateParentGuidance = async (childTranscript: string) => {
    console.log('🧠 Generating parent guidance for:', childTranscript)
    try {
      const requestData = {
        childId,
        childName,
        childAge,
        conversationHistory: conversationHistory.slice(-6),
        conversationTheme,
        recentTranscription: childTranscript,
        speakerType: 'child'
      }
      
      console.log('📡 Sending request to family-ai-assist:', requestData)
      
      const response = await fetch('/api/conversations/family-ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      
      console.log('📨 Response status:', response.status)
      
      if (response.ok) {
        const suggestion = await response.json()
        console.log('✅ Got AI suggestion:', suggestion)
        setCurrentSuggestion(suggestion)
        
        // Speak guidance to parent in a facilitator voice
        if (aiVolume && suggestion.shouldSpeak) {
          const parentGuidance = `Here's a suggestion: ${suggestion.content}`
          addToHistory(`AI Guidance: ${parentGuidance}`)
          speakToFamily(parentGuidance, 'parent')
        }
      } else {
        const errorText = await response.text()
        console.error('❌ API error:', response.status, errorText)
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Failed to get parent guidance:', error)
      
      // Fallback parent guidance
      const lowerTranscript = childTranscript.toLowerCase()
      let guidance = ''
      
      if (lowerTranscript.includes('why')) {
        guidance = `${childName} asked a "why" question! Try saying: "That's a great question! What do you think the reason might be?" This helps them think through the answer.`
      } else if (lowerTranscript.includes('what')) {
        guidance = `${childName} wants to know "what" something is! Try: "What do you already know about that?" to build on their existing knowledge.`
      } else if (lowerTranscript.includes('how')) {
        guidance = `${childName} is curious about "how" things work! Try: "How do you think it might work?" to encourage their problem-solving.`
      } else if (lowerTranscript.includes('suggestion') || lowerTranscript.includes('help')) {
        guidance = `I hear you asking for guidance! Try starting with: "${childName}, what's something you're really curious about today?" Let them choose the topic.`
      } else {
        guidance = `${childName} shared something interesting! Try: "Tell me more about that!" or "What do you think about...?" to keep them talking.`
      }
      
      console.log('🔄 Using fallback guidance:', guidance)
      
      setCurrentSuggestion({
        type: 'parent_guidance',
        content: guidance,
        reasoning: 'Helping parent respond to child\'s curiosity',
        isForParent: true
      })
    }
  }

  // Generate follow-up suggestions after parent speaks
  const generateFollowUpSuggestion = async (parentTranscript: string) => {
    console.log('🔄 Generating follow-up suggestion for:', parentTranscript)
    try {
      const requestData = {
        childId,
        childName,
        childAge,
        conversationHistory: conversationHistory.slice(-6),
        conversationTheme,
        recentTranscription: parentTranscript,
        speakerType: 'parent'
      }
      
      console.log('📡 Sending follow-up request:', requestData)
      
      const response = await fetch('/api/conversations/family-ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      
      console.log('📨 Follow-up response status:', response.status)
      
      if (response.ok) {
        const suggestion = await response.json()
        console.log('✅ Got follow-up suggestion:', suggestion)
        setCurrentSuggestion(suggestion)
      } else {
        const errorText = await response.text()
        console.error('❌ Follow-up API error:', response.status, errorText)
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Failed to get follow-up suggestion:', error)
      
      // Enhanced fallback suggestions based on input
      const lowerTranscript = parentTranscript.toLowerCase()
      let suggestion = ''
      
      if (lowerTranscript.includes('suggestion') || lowerTranscript.includes('help')) {
        suggestion = `I can help! Start by asking ${childName}: "What's something that made you curious today?" Then follow their lead!`
      } else if (lowerTranscript.includes('why') || lowerTranscript.includes('how') || lowerTranscript.includes('what')) {
        suggestion = `Great question! Now ask ${childName}: "What do you think the answer might be?" This helps them think it through first.`
      } else {
        const suggestions = [
          `Excellent! Now try: "${childName}, what else do you notice about that?"`,
          `Nice! You could ask: "Why do you think that happens?"`,
          `Great! Try: "What would happen if we tried something different?"`,
          `Perfect! Ask: "How is that like something else you know?"`
        ]
        suggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
      }
      
      console.log('🔄 Using fallback follow-up:', suggestion)
      
      setCurrentSuggestion({
        type: 'follow_up',
        content: suggestion,
        reasoning: 'Encouraging deeper conversation exploration',
        isForParent: true
      })
    }
  }

  // Enhanced AI suggestion that listens to conversation context
  const getAISuggestion = async () => {
    if (!conversationTheme && conversationHistory.length === 0) {
      // First suggestion: help establish a theme
      return {
        type: 'theme_suggestion' as const,
        content: `Maybe you could explore ${childName}'s favorite animals, or ask about something they built recently?`,
        parentGuidance: `Start by asking ${childName} what they're most curious about today. Let them choose the direction.`,
        reasoning: 'Establishing an initial theme based on child interests',
        isForParent: true
      }
    }

    try {
      const response = await fetch('/api/conversations/family-ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          childName,
          childAge,
          conversationHistory: conversationHistory.slice(-6), // Last 6 exchanges
          conversationTheme,
          recentTranscription
        })
      })

      if (response.ok) {
        const suggestion = await response.json()
        return suggestion
      }
    } catch (error) {
      console.error('Failed to get AI suggestion:', error)
    }

    // Fallback suggestions based on conversation length
    if (conversationHistory.length < 3) {
      return {
        type: 'follow_up' as const,
        content: `Ask ${childName} to tell you more about that! "What do you think would happen if...?"`,
        parentGuidance: `${childName} seems interested in this topic. Try asking "why" or "how" questions to dig deeper.`,
        reasoning: 'Encouraging deeper exploration of the topic',
        isForParent: true
      }
    } else {
      return {
        type: 'encouragement' as const,
        content: `${childName} is sharing such interesting ideas! Ask them what they think might happen next.`,
        parentGuidance: `Great conversation! Help ${childName} make connections: "That reminds me of..." or "What if we tried..."`,
        reasoning: 'Supporting ongoing engagement and connection-making',
        isForParent: true
      }
    }
  }

  // Conversational speech function for family facilitation
  const speakToFamily = (text: string, targetAudience: 'family' | 'parent' | 'child' = 'family') => {
    if (!aiVolume || typeof window === 'undefined' || !window.speechSynthesis) return

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      // Create the speech utterance
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Conversational voice settings based on audience
      if (targetAudience === 'child') {
        utterance.pitch = 1.3    // Slightly higher for children
        utterance.rate = 0.85    // Slower for children's comprehension
        utterance.volume = 0.9   // Clear volume for children
      } else if (targetAudience === 'parent') {
        utterance.pitch = 1.0    // Natural pitch for adults
        utterance.rate = 1.0     // Normal speaking rate
        utterance.volume = 0.8   // Professional volume
      } else {
        // Family mode - balanced for both audiences
        utterance.pitch = 1.15   // Slightly warm and friendly
        utterance.rate = 0.9     // Clear for everyone
        utterance.volume = 0.85  // Good for group listening
      }
      
      // Find the best conversational voice
      const voices = window.speechSynthesis.getVoices()
      
      // Prioritize warm, conversational voices
      const conversationalVoice = voices.find(voice => 
        voice.lang.includes('en') && (
          voice.name.includes('Samantha') ||    // Mac - very natural
          voice.name.includes('Alex') ||        // Mac - warm
          voice.name.includes('Karen') ||       // Good female voice
          voice.name.includes('Moira') ||       // Irish - friendly
          voice.name.includes('Tessa') ||       // South African - clear
          voice.name.includes('Veena') ||       // Indian English - warm
          voice.name.includes('Zira') ||        // Microsoft - clear
          voice.name.includes('Hazel')          // UK - professional
        )
      ) || voices.find(voice => 
        voice.lang.includes('en') && 
        voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => voice.lang.includes('en'))
      
      if (conversationalVoice) {
        utterance.voice = conversationalVoice
      }
      
      // Enhanced event handlers with visual feedback
      utterance.onstart = () => {
        setIsAISpeaking(true)
        console.log('🎤 AI Facilitator speaking:', text.substring(0, 50) + '...')
      }
      
      utterance.onend = () => {
        setIsAISpeaking(false)
        console.log('✅ Speech completed')
      }
      
      utterance.onerror = (event) => {
        console.warn('❌ Speech error:', event.error)
        setIsAISpeaking(false)
      }
      
      // Add natural pauses for better flow
      const processedText = addNaturalPauses(text)
      utterance.text = processedText
      
      // Speak with emphasis on being a facilitator
      window.speechSynthesis.speak(utterance)
      
    } catch (error) {
      console.warn('❌ Family speech failed:', error)
      setIsAISpeaking(false)
    }
  }

  // Add natural pauses and conversational flow
  const addNaturalPauses = (text: string): string => {
    return text
      // Add pauses after questions for emphasis
      .replace(/\?/g, '?... ')
      // Add pause after "Now," for natural flow
      .replace(/Now,/g, 'Now... ')
      // Add pause after "Great!" for emphasis
      .replace(/Great!/g, 'Great!... ')
      // Add pause after "Perfect!" for emphasis  
      .replace(/Perfect!/g, 'Perfect!... ')
      // Add pause before suggestions
      .replace(/Try asking/g, '... Try asking')
      .replace(/You could/g, '... You could')
      // Add pause for better flow with child's name
      .replace(new RegExp(`${childName},`, 'g'), `${childName}... `)
  }

  // Start conversation with theme establishment
  const handleStartConversation = async () => {
    setIsActive(true)
    setDuration(0)
    setConversationHistory([])
    setConversationTheme('')
    
    // Start duration timer
    durationInterval.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)

    try {
      await startRecording()
      
      // Start speech recognition for interactive mode
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (err) {
          console.warn('Could not start speech recognition:', err)
        }
      }
      
      // Simple, friendly welcome message
      let welcomeMessage = ''
      
      if (childAge <= 5) {
        welcomeMessage = `Welcome, family! I'm excited to help you have a wonderful conversation together. ${childName}, I can't wait to hear what you're curious about today! Parents, I'll whisper helpful suggestions to guide your discussion and keep ${childName} engaged.`
      } else if (childAge <= 10) {
        welcomeMessage = `Hello ${childName} and family! I'm your personal conversation facilitator. As you talk, I'll be listening carefully and providing parents with real-time suggestions on how to ask follow-up questions and explore ${childName}'s interests more deeply. Let's create some amazing family moments together!`
      } else {
        welcomeMessage = `Hi ${childName} and family! I'm here to facilitate meaningful conversations between you. I'll help parents ask thoughtful questions that encourage ${childName} to share their ideas and explore topics they're passionate about. Think of me as your family discussion guide!`
      }
      
      addToHistory(`AI: ${welcomeMessage}`)
      
      if (aiVolume) {
        speakToFamily(welcomeMessage, 'family')
      }

      // Start suggestion cycle (less frequent, more contextual)
      suggestionInterval.current = setInterval(async () => {
        const suggestion = await getAISuggestion()
        setCurrentSuggestion(suggestion)
      }, 15000) // Every 15 seconds instead of 5

      // Get initial suggestion for parent
      setTimeout(async () => {
        const initialSuggestion = await getAISuggestion()
        setCurrentSuggestion(initialSuggestion)
      }, 3000)
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsActive(false)
    }
  }

  const handleEndConversation = async () => {
    setIsActive(false)
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (err) {
        console.warn('Error stopping speech recognition:', err)
      }
    }
    
    // Stop timers
    if (durationInterval.current) {
      clearInterval(durationInterval.current)
      durationInterval.current = null
    }
    if (suggestionInterval.current) {
      clearInterval(suggestionInterval.current)
      suggestionInterval.current = null
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
      speechTimeoutRef.current = null
    }
    
    // Stop any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    
    // Simple, friendly farewell message
    let farewellMessage = ''
    
    if (childAge <= 5) {
      farewellMessage = `Great conversation, ${childName}! You asked such good questions! Keep being curious and learning new things!`
    } else if (childAge <= 10) {
      farewellMessage = `That was a wonderful conversation, ${childName}! Your questions were really thoughtful. Keep exploring and discovering new things!`
    } else {
      farewellMessage = `What an excellent conversation, ${childName}! Your curiosity and questions were impressive. Keep having great discussions with your family!`
    }
    
          addToHistory(`AI: ${farewellMessage}`)
      
      if (aiVolume) {
        speakToFamily(farewellMessage, 'family')
      }
    
    try {
      await stopRecording()
    } catch (error) {
      console.error('Failed to stop recording:', error)
    }

    // Save conversation to database
    try {
      const conversationText = conversationHistory.join('\n')
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          title: `Family AI Conversation${conversationTheme ? ': ' + conversationTheme : ''}`,
          transcription: conversationText,
          duration: duration
        })
      })

      if (response.ok) {
        const data = await response.json()
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

  const addToHistory = (entry: string) => {
    setConversationHistory(prev => [...prev, entry])
  }

  const dismissSuggestion = () => {
    setCurrentSuggestion(null)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isActive) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-purple-600" />
            <Users className="h-6 w-6 text-primary-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Interactive Family Conversation Facilitator
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Your AI conversation guide that speaks to the family and helps parents facilitate meaningful discussions with {childName}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Voice Settings */}
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Voice Settings
            </Button>
            
            {showVoiceSettings && (
              <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-purple-800">Choose Your AI Character Voice</label>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Age {childAge} - Voices optimized for your child
                    </span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableVoices.map((voice) => (
                      <div
                        key={voice.uniqueId || `${voice.name}-${voice.lang}-fallback`}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedVoice?.name === voice.name
                            ? 'border-purple-500 bg-purple-100 shadow-md'
                            : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                        }`}
                        onClick={() => setSelectedVoice(voice)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">
                                {voice.character === 'Fairy Godmother' ? '🧚‍♀️' :
                                 voice.character === 'Princess Guide' ? '👸' :
                                 voice.character === 'Cheerful Teacher' ? '👩‍🏫' :
                                 voice.character === 'Wise Narrator' ? '📚' :
                                 voice.character === 'Curious Explorer' ? '🗺️' :
                                 voice.character === 'Magic Friend' ? '✨' :
                                 voice.character === 'Pixie Friend' ? '🧚' :
                                 voice.character === 'Story Companion' ? '📖' :
                                 voice.character === 'Friendly Guide' ? '🤗' : '🎭'}
                              </span>
                              <span className="font-medium text-purple-800">{voice.character}</span>
                              {selectedVoice?.name === voice.name && (
                                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">Selected</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{voice.description}</p>
                            {voice.ageRecommendation && (
                              <p className="text-xs font-medium text-green-600 mb-1">
                                🎯 {voice.ageRecommendation}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">{voice.name}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedVoice && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const character = selectedVoice?.character || 'Friendly Helper'
                        let testMessage = ''
                        
                        if (childAge <= 5) {
                          testMessage = `Hello everyone! I'm your family conversation helper. I'll suggest fun questions for parents to ask ${childName} about things they're curious about!`
                        } else if (childAge <= 10) {
                          testMessage = `Hi ${childName} and family! I'm your conversation facilitator. I'll help parents ask great questions to explore ${childName}'s interests together!`
                        } else {
                          testMessage = `Hello ${childName} and family! I'm here to facilitate meaningful conversations. I'll provide parents with suggestions to deepen discussions about ${childName}'s curiosity!`
                        }
                        
                        speakToFamily(testMessage, 'family')
                      }}
                      className="w-full bg-white hover:bg-purple-50 border-purple-300 text-purple-700"
                    >
                      🎵 Test Voice
                    </Button>
                    <p className="text-xs text-center text-purple-600">
                      Voice test completed ✨
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-center space-y-4">
            <Button
              onClick={handleStartConversation}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-primary-600 hover:from-purple-700 hover:to-primary-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg"
            >
              <Users className="h-5 w-5 mr-2" />
              Start Family Facilitated Conversation
            </Button>
            
            <p className="text-sm text-gray-600">
              AI will listen to your conversation and provide real-time suggestions to help you explore {childName}'s interests deeper
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {formatDuration(duration)}
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">
          Family Conversation: Facilitating Discussion with {childName}
        </CardTitle>
        <CardDescription>
          🎧 Listening to conversation • 💡 Providing parent guidance • 🔄 Focusing on single themes ✨
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* AI Suggestion Card */}
        {currentSuggestion && (
          <Card className="border-primary-200 bg-primary-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary-600" />
                  <Badge variant="outline" className="bg-white text-primary-700 border-primary-300">
                    {currentSuggestion.type === 'follow_up' ? 'Follow-up Question' :
                     currentSuggestion.type === 'theme_suggestion' ? 'Theme Suggestion' :
                     currentSuggestion.type === 'parent_guidance' ? 'Parent Guidance' : 'Encouragement'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissSuggestion}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <p className="text-primary-800 font-medium">
                {currentSuggestion.content}
              </p>
              {currentSuggestion.parentGuidance && (
                <p className="text-sm text-primary-700 italic">
                  💡 {currentSuggestion.parentGuidance}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setAiVolume(!aiVolume)}
            className={cn(
              "flex items-center gap-2",
              aiVolume ? "text-primary-600 border-primary-300" : "text-gray-400"
            )}
          >
            {aiVolume ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            AI Voice {aiVolume ? 'On' : 'Off'}
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <div className={cn(
                "h-3 w-3 rounded-full",
                isRecording ? "bg-red-500 animate-pulse" : "bg-green-500"
              )} />
              <span className="text-sm font-medium text-green-700">
                {isRecording ? 'Recording...' : 'Ready'}
              </span>
            </div>
            
            {isListening && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-blue-700">
                  Listening for speech...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Speech & Conversation Theme */}
        <div className="text-center space-y-2">
          {lastProcessedSpeech && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">Last heard:</p>
              <p className="text-sm font-medium text-gray-800">"{lastProcessedSpeech}"</p>
            </div>
          )}
          
          {conversationTheme && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Theme: {conversationTheme}
            </Badge>
          )}
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={async () => {
              console.log('🆘 Manual guidance requested')
              const lastTranscript = lastProcessedSpeech || "help with conversation guidance"
              await generateFollowUpSuggestion(lastTranscript)
            }}
            variant="outline"
            size="lg"
            className="border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            💡 Get Guidance Now
          </Button>
          <Button
            onClick={handleEndConversation}
            variant="outline"
            size="lg"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            End & Save
          </Button>
        </div>

        {/* Tips */}
        <Card className="bg-warm-50 border-warm-200">
          <CardContent className="pt-4">
            <h4 className="font-medium text-warm-800 mb-2">Family Facilitation Tips</h4>
            <ul className="text-sm text-warm-700 space-y-1">
              <li>• 🎯 Focus on ONE topic that interests {childName} most</li>
              <li>• ❓ Ask follow-up questions about the SAME subject to go deeper</li>
              <li>• 👂 Let {childName} share their thoughts before providing answers</li>
              <li>• 💡 Use AI suggestions to guide your responses, not replace your conversation</li>
              <li>• 🔄 Build on what {childName} says rather than jumping to new topics</li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
