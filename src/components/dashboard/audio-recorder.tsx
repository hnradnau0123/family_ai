'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAudioRecording } from '@/hooks/useAudioRecording'
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  X, 
  Upload,
  Clock,
  Volume2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils'

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
  disabled?: boolean
}

export function AudioRecorder({ onRecordingComplete, onCancel, disabled }: AudioRecorderProps) {
  const [hasRecording, setHasRecording] = useState(false)
  const [currentRecording, setCurrentRecording] = useState<{ blob: Blob; duration: number } | null>(null)
  
  const {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecording()

  const handleStartRecording = async () => {
    try {
      await startRecording()
      setHasRecording(false)
      setCurrentRecording(null)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to start recording. Please check your microphone permissions.')
    }
  }

  const handleStopRecording = async () => {
    try {
      const recording = await stopRecording()
      setCurrentRecording({ blob: recording.blob, duration: recording.duration })
      setHasRecording(true)
    } catch (error) {
      console.error('Failed to stop recording:', error)
    }
  }

  const handleSubmitRecording = () => {
    if (currentRecording) {
      onRecordingComplete(currentRecording.blob, currentRecording.duration)
    }
  }

  const handleCancelRecording = () => {
    if (isRecording) {
      cancelRecording()
    }
    setHasRecording(false)
    setCurrentRecording(null)
    onCancel()
  }

  const getAudioLevelWidth = () => {
    return Math.max(2, audioLevel * 100)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mic className="h-5 w-5 text-primary-600" />
          Record Conversation
        </CardTitle>
        <CardDescription>
          Capture a moment with your child to discover their curiosity patterns
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Recording Status */}
        <div className="text-center space-y-2">
          {isRecording && (
            <div className="flex items-center justify-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                isPaused ? "bg-amber-500" : "bg-red-500"
              )} />
              <span className="text-sm font-medium">
                {isPaused ? 'Recording Paused' : 'Recording...'}
              </span>
            </div>
          )}
          
          {hasRecording && !isRecording && (
            <div className="text-sm text-green-600 font-medium">
              ✓ Recording Complete
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-2xl font-mono font-bold text-neutral-700">
            <Clock className="h-5 w-5" />
            {formatDuration(duration)}
          </div>
        </div>

        {/* Audio Level Indicator */}
        {isRecording && !isPaused && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Volume2 className="h-4 w-4" />
              Audio Level
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100 ease-out rounded-full"
                style={{ width: `${getAudioLevelWidth()}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          {!isRecording && !hasRecording && (
            <>
              <Button
                onClick={handleStartRecording}
                disabled={disabled}
                size="lg"
                className="flex-1"
              >
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
              <Button
                onClick={handleCancelRecording}
                variant="outline"
                size="lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}

          {isRecording && (
            <>
              <Button
                onClick={isPaused ? resumeRecording : pauseRecording}
                variant="outline"
                size="lg"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleStopRecording}
                variant="default"
                size="lg"
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
              <Button
                onClick={handleCancelRecording}
                variant="outline"
                size="lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}

          {hasRecording && !isRecording && (
            <>
              <Button
                onClick={handleStartRecording}
                variant="outline"
                size="lg"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSubmitRecording}
                size="lg"
                className="flex-1"
                disabled={disabled}
              >
                <Upload className="h-4 w-4 mr-2" />
                Submit Recording
              </Button>
              <Button
                onClick={handleCancelRecording}
                variant="outline"
                size="lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Tips */}
        <div className="text-xs text-neutral-600 space-y-1">
          <p className="font-medium">💡 Recording Tips:</p>
          <ul className="space-y-1 ml-4">
            <li>• Find a quiet space for clear audio</li>
            <li>• Engage naturally with your child</li>
            <li>• 2-10 minutes captures great insights</li>
            <li>• Ask open-ended questions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
