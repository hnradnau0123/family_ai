import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  // Note: PrismaAdapter is commented out for credentials provider compatibility
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        
        try {
          // Find or create user in database
          let user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })
          
          if (!user) {
            // Create new user for demo (in production, you'd verify credentials)
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split('@')[0],
              }
            })
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token.uid) {
        (session.user as any).id = token.uid as string
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}