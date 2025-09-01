'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewChildPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    birthDate: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/dashboard/children')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create child profile')
      }
    } catch (error) {
      console.error('Error creating child:', error)
      alert('Failed to create child profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link 
          href="/dashboard/children"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Children
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 font-display">
            Add Child Profile
          </h1>
          <p className="text-neutral-600 mt-1">
            Create a profile to start tracking your child's curiosity and development
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle>Child Information</CardTitle>
              <CardDescription>
                Basic details to personalize your child's experience
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Child's Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your child's name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-neutral-600">
                This helps us provide age-appropriate conversation starters and insights
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/children" className="flex-1">
                <Button variant="outline" className="w-full" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading || !formData.name || !formData.birthDate}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Create Profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Privacy Note */}
      <Card className="bg-warm-50 border-warm-200">
        <CardContent className="p-6">
          <h3 className="font-medium text-neutral-900 mb-2">🔒 Privacy & Security</h3>
          <p className="text-sm text-neutral-700">
            Your child's information is encrypted and stored securely. We never share personal data 
            with third parties. All conversation analysis happens privately within our secure system 
            to provide you with personalized insights about your child's development.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
