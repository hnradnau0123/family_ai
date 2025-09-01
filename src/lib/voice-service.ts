import { ElevenLabsApi, ElevenLabsOptions } from '@elevenlabs/elevenlabs-js'

interface VoiceProfile {
  id: string
  name: string
  type: 'parent' | 'child' | 'facilitator'
  description: string
  elevenLabsVoiceId?: string
}

interface VoiceDetectionResult {
  speakerType: 'parent' | 'child' | 'unknown'
  confidence: number
  ageEstimate?: number
  gender?: 'male' | 'female' | 'unknown'
}

class VoiceService {
  private elevenLabs: ElevenLabsApi | null = null
  private audioContext: AudioContext | null = null
  
  // Pre-defined voice profiles for different family members
  private voiceProfiles: VoiceProfile[] = [
    {
      id: 'facilitator-calm',
      name: 'Calm Facilitator',
      type: 'facilitator',
      description: 'Warm, gentle voice for guiding family conversations',
      elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm female voice
    },
    {
      id: 'facilitator-friendly',
      name: 'Friendly Guide',
      type: 'facilitator', 
      description: 'Approachable voice for encouraging dialogue',
      elevenLabsVoiceId: 'ErXwobaYiN019PkySvjV', // Antoni - friendly male voice
    },
    {
      id: 'child-companion',
      name: 'Child Companion',
      type: 'facilitator',
      description: 'Younger-sounding voice for connecting with children',
      elevenLabsVoiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi - youthful voice
    }
  ]

  constructor() {
    this.initializeElevenLabs()
    this.initializeAudioContext()
  }

  private initializeElevenLabs() {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (apiKey) {
      this.elevenLabs = new ElevenLabsApi({
        apiKey: apiKey,
      } as ElevenLabsOptions)
    }
  }

  private initializeAudioContext() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  /**
   * Analyze audio to detect if speaker is parent or child
   */
  async detectSpeakerType(audioBuffer: ArrayBuffer): Promise<VoiceDetectionResult> {
    try {
      // For now, we'll use a simple heuristic based on audio characteristics
      // In production, you might want to use a more sophisticated ML model
      const audioData = new Float32Array(audioBuffer)
      
      // Simple frequency analysis to estimate age/speaker type
      const pitch = this.estimatePitch(audioData)
      const energy = this.calculateEnergy(audioData)
      
      // Higher pitch usually indicates younger speaker
      const ageEstimate = this.estimateAge(pitch, energy)
      
      let speakerType: 'parent' | 'child' | 'unknown' = 'unknown'
      let confidence = 0.5
      
      if (ageEstimate < 12) {
        speakerType = 'child'
        confidence = 0.7
      } else if (ageEstimate > 18) {
        speakerType = 'parent'
        confidence = 0.8
      }
      
      return {
        speakerType,
        confidence,
        ageEstimate,
        gender: pitch > 180 ? 'female' : 'male'
      }
    } catch (error) {
      console.error('Voice detection error:', error)
      return {
        speakerType: 'unknown',
        confidence: 0.1
      }
    }
  }

  /**
   * Generate speech using ElevenLabs with contextual voice selection
   */
  async generateSpeech(
    text: string, 
    context: {
      speakerType?: 'parent' | 'child'
      emotionalTone?: 'encouraging' | 'curious' | 'supportive' | 'playful'
      childAge?: number
    } = {}
  ): Promise<ArrayBuffer | null> {
    if (!this.elevenLabs) {
      console.warn('ElevenLabs not initialized, falling back to Web Speech API')
      return this.fallbackWebSpeech(text, context)
    }

    try {
      // Select appropriate voice based on context
      const voiceProfile = this.selectVoiceProfile(context)
      
      // Add natural conversation markers and emotional context
      const enhancedText = this.enhanceTextForSpeech(text, context)
      
      const response = await this.elevenLabs.textToSpeech.textToSpeech(
        voiceProfile.elevenLabsVoiceId!,
        {
          text: enhancedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        }
      )

      return await response.arrayBuffer()
    } catch (error) {
      console.error('ElevenLabs speech generation error:', error)
      return this.fallbackWebSpeech(text, context)
    }
  }

  /**
   * Play audio with proper timing and interruption handling
   */
  async playAudio(audioBuffer: ArrayBuffer, onComplete?: () => void): Promise<void> {
    if (!this.audioContext) {
      console.error('Audio context not available')
      return
    }

    try {
      const audioBufferSource = this.audioContext.createBufferSource()
      const decodedBuffer = await this.audioContext.decodeAudioData(audioBuffer.slice(0))
      
      audioBufferSource.buffer = decodedBuffer
      audioBufferSource.connect(this.audioContext.destination)
      
      audioBufferSource.onended = () => {
        onComplete?.()
      }
      
      audioBufferSource.start(0)
    } catch (error) {
      console.error('Audio playback error:', error)
      onComplete?.()
    }
  }

  /**
   * Create contextual facilitator responses based on conversation analysis
   */
  generateFacilitatorPrompt(
    conversationHistory: string[],
    lastSpeakerType: 'parent' | 'child',
    childAge: number,
    researchContext?: string
  ): string {
    const prompts = {
      encourage_child: [
        "That's a wonderful observation! Can you tell us more about what made you think of that?",
        "I love how curious you are! What else would you like to explore about this?",
        "That's such an interesting way to think about it! What questions do you have?"
      ],
      guide_parent: [
        "This might be a great moment to ask them about their reasoning behind that thought.",
        "Consider exploring the 'why' behind their curiosity - what sparked that interest?",
        "This could be a perfect opportunity to dive deeper into their natural wonder about this topic."
      ],
      bridge_conversation: [
        "I notice you both have interesting perspectives on this. How might they connect?",
        "This is fascinating! Parent, what do you think about your child's insight?",
        "There's something beautiful happening in this conversation. Shall we explore it together?"
      ]
    }

    // Select appropriate prompt based on context
    if (lastSpeakerType === 'child' && childAge < 8) {
      return prompts.encourage_child[Math.floor(Math.random() * prompts.encourage_child.length)]
    } else if (lastSpeakerType === 'child') {
      return prompts.bridge_conversation[Math.floor(Math.random() * prompts.bridge_conversation.length)]
    } else {
      return prompts.guide_parent[Math.floor(Math.random() * prompts.guide_parent.length)]
    }
  }

  // Private helper methods
  private selectVoiceProfile(context: any): VoiceProfile {
    if (context.childAge && context.childAge < 8) {
      return this.voiceProfiles.find(v => v.id === 'child-companion') || this.voiceProfiles[0]
    }
    
    if (context.emotionalTone === 'playful') {
      return this.voiceProfiles.find(v => v.id === 'facilitator-friendly') || this.voiceProfiles[1]
    }
    
    return this.voiceProfiles[0] // Default to calm facilitator
  }

  private enhanceTextForSpeech(text: string, context: any): string {
    // Add natural pauses and emphasis
    let enhanced = text.replace(/\./g, '... ')
    enhanced = enhanced.replace(/\?/g, '? ')
    enhanced = enhanced.replace(/!/g, '! ')
    
    // Add emotional context
    if (context.emotionalTone === 'encouraging') {
      enhanced = `*speaking warmly* ${enhanced}`
    } else if (context.emotionalTone === 'curious') {
      enhanced = `*with genuine curiosity* ${enhanced}`
    }
    
    return enhanced
  }

  private async fallbackWebSpeech(text: string, context: any): Promise<ArrayBuffer | null> {
    // Fallback to Web Speech API if ElevenLabs fails
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve(null)
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = context.childAge && context.childAge < 10 ? 1.2 : 1.0
      utterance.volume = 0.8
      
      // Find a suitable voice
      const voices = speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Female')
      ) || voices.find(voice => voice.lang.startsWith('en'))
      
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onend = () => resolve(null)
      utterance.onerror = () => resolve(null)
      
      speechSynthesis.speak(utterance)
    })
  }

  private estimatePitch(audioData: Float32Array): number {
    // Simple autocorrelation-based pitch estimation
    const sampleRate = 44100 // Assuming standard sample rate
    const minPeriod = Math.floor(sampleRate / 800) // 800 Hz max
    const maxPeriod = Math.floor(sampleRate / 80)  // 80 Hz min
    
    let bestCorrelation = 0
    let bestPeriod = minPeriod
    
    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0
      for (let i = 0; i < audioData.length - period; i++) {
        correlation += audioData[i] * audioData[i + period]
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestPeriod = period
      }
    }
    
    return sampleRate / bestPeriod
  }

  private calculateEnergy(audioData: Float32Array): number {
    let energy = 0
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i]
    }
    return energy / audioData.length
  }

  private estimateAge(pitch: number, energy: number): number {
    // Simple heuristic for age estimation
    // Higher pitch generally correlates with younger speakers
    if (pitch > 250) return 6   // Young child
    if (pitch > 220) return 10  // Older child
    if (pitch > 180) return 16  // Teenager/young adult
    return 30 // Adult
  }
}

export const voiceService = new VoiceService()
export type { VoiceDetectionResult, VoiceProfile }
