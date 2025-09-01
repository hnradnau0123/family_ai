'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Users, Sparkles, Mail } from 'lucide-react'

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const router = useRouter()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsLoading(true)
    try {
      const result = await signIn('credentials', { 
        email,
        password: 'demo', // For demo purposes
        redirect: false,
        callbackUrl: '/dashboard'
      })
      
      if (result?.ok) {
        const session = await getSession()
        if (session) {
          router.push('/dashboard')
        }
      } else {
        alert('Sign in failed. Please try again.')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      alert('Sign in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 font-display">
              Curiosity Co-pilot
            </h1>
            <p className="text-neutral-600 mt-2">
              Discover your child's unique spark through everyday conversations
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid gap-4">
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-warm-200">
            <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900">Family Connection</h3>
              <p className="text-sm text-neutral-600">Transform daily moments into meaningful discoveries</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-warm-200">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900">Child Insights</h3>
              <p className="text-sm text-neutral-600">Understand your child's interests and strengths</p>
            </div>
          </div>
        </div>

        {/* Sign In Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome to Your Family Journey</CardTitle>
            <CardDescription>
              Sign in to start discovering what makes your child uniquely curious
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-neutral-600">
                  For demo: any email will work (no password needed)
                </p>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-12 text-base"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>
            
            <p className="text-xs text-neutral-500 text-center mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="text-center space-y-2">
          <p className="text-sm text-neutral-600">
            Trusted by families who believe in child-centered parenting
          </p>
          <div className="flex justify-center items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-2 border-white"
                />
              ))}
            </div>
            <span className="text-sm text-neutral-600">+50 families and growing</span>
          </div>
        </div>
      </div>
    </div>
  )
}
