'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AudioRecorder } from '@/components/dashboard/audio-recorder'
import { RealTimeConversation } from '@/components/dashboard/real-time-conversation'
import { InteractiveAIConversation } from '@/components/dashboard/interactive-ai-conversation'
import { ImprovedInteractiveAI } from '@/components/dashboard/improved-interactive-ai'
import { ArrowLeft, MessageCircle, Users, Sparkles, Brain } from 'lucide-react'
import Link from 'next/link'

interface Child {
  id: string
  name: string
  birthDate: string
}

export default function NewConversationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedChildId = searchParams.get('childId')
  
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState(preselectedChildId || '')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const [conversationMode, setConversationMode] = useState<'traditional' | 'realtime' | 'interactive'>('traditional')

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/children')
      if (response.ok) {
        const data = await response.json()
        setChildren(data || []) // API now returns array directly
        
        // If only one child, auto-select
        if (data && data.length === 1 && !selectedChildId) {
          setSelectedChildId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error)
      setChildren([]) // Ensure children is always an array
    }
  }

  const handleStartRecording = () => {
    if (!selectedChildId) {
      alert('Please select a child first')
      return
    }
    setShowRecorder(true)
  }

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'conversation.webm')
      formData.append('childId', selectedChildId)
      formData.append('title', title || 'Untitled Conversation')
      formData.append('duration', duration.toString())

      const response = await fetch('/api/conversations', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/dashboard/conversations/${data.conversation.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save conversation')
      }
    } catch (error) {
      console.error('Error saving conversation:', error)
      alert('Failed to save conversation')
    } finally {
      setLoading(false)
    }
  }

  const handleRecordingCancel = () => {
    setShowRecorder(false)
  }

  const selectedChild = children?.find(child => child.id === selectedChildId)

  if (!children || children.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 font-display">
              Record Conversation
            </h1>
            <p className="text-neutral-600 mt-1">
              Capture a moment with your child to discover their curiosity patterns
            </p>
          </div>
        </div>

        <Card className="py-12">
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No child profiles found
              </h3>
              <p className="text-neutral-600 max-w-md mx-auto">
                You need to create at least one child profile before you can record conversations.
              </p>
            </div>
            <Link href="/dashboard/children/new">
              <Button>
                Create Child Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 font-display">
            Record Conversation
          </h1>
          <p className="text-neutral-600 mt-1">
            Capture a moment with your child to discover their curiosity patterns
          </p>
        </div>
      </div>

      {!showRecorder ? (
        /* Setup Form */
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <CardTitle>Conversation Details</CardTitle>
                <CardDescription>
                  Set up your recording session
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="child">Select Child</Label>
              <select
                id="child"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                required
              >
                <option value="">Choose a child...</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Conversation Title (Optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Bedtime questions about space"
              />
              <p className="text-xs text-neutral-600">
                Leave blank for automatic title generation
              </p>
            </div>

            <div className="space-y-2">
              <Label>Conversation Mode</Label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setConversationMode('traditional')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    conversationMode === 'traditional'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <MessageCircle className="h-5 w-5 text-primary-600" />
                    <span className="font-medium">Traditional Recording</span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Record and analyze conversations for insights afterward
                  </p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setConversationMode('realtime')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    conversationMode === 'realtime'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-5 w-5 text-primary-600" />
                    <span className="font-medium">AI-Guided Conversation</span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Get real-time suggestions to enhance learning and curiosity
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setConversationMode('interactive')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    conversationMode === 'interactive'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Interactive AI Partner</span>
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-medium">NEW!</span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    AI speaks directly to your child - asking questions, sharing facts, and encouraging curiosity
                  </p>
                </button>
              </div>
            </div>

            {selectedChild && (
              <div className="p-4 bg-warm-50 rounded-lg border border-warm-200">
                <h3 className="font-medium text-neutral-900 mb-2">
                  Recording with {selectedChild.name}
                </h3>
                <p className="text-sm text-neutral-700">
                  Age: {Math.floor((Date.now() - new Date(selectedChild.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years old
                </p>
              </div>
            )}

            <Button 
              onClick={handleStartRecording}
              className="w-full"
              disabled={!selectedChildId}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Recorder Component - Traditional, Real-time, or Interactive */
        conversationMode === 'traditional' ? (
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            onCancel={handleRecordingCancel}
            disabled={loading}
          />
        ) : conversationMode === 'realtime' ? (
          <RealTimeConversation
            childId={selectedChildId}
            childName={selectedChild?.name || ''}
            childAge={selectedChild ? Math.floor((Date.now() - new Date(selectedChild.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0}
            onConversationComplete={handleRecordingComplete}
          />
                       ) : (
                 <ImprovedInteractiveAI
                   childId={selectedChildId}
                   childName={selectedChild?.name || ''}
                   childAge={selectedChild ? Math.floor((Date.now() - new Date(selectedChild.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0}
                 />
               )
      )}

      {/* Tips */}
      <Card className="bg-gradient-to-r from-secondary-50 to-primary-50 border-secondary-200">
        <CardContent className="p-6">
          <h3 className="font-medium text-neutral-900 mb-3">💡 Recording Tips for Great Insights</h3>
          <div className="space-y-2 text-sm text-neutral-700">
            <p><strong>Best moments to record:</strong> Meal times, walks, car rides, bedtime stories</p>
            <p><strong>Duration:</strong> 2-10 minutes captures meaningful patterns</p>
            <p><strong>Conversation starters:</strong> "What if...", "Why do you think...", "How would you..."</p>
            <p><strong>Stay natural:</strong> Let your child lead the conversation direction</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
