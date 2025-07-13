import { MongoDBAdapter } from '@auth/mongodb-adapter'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectToDatabase } from './lib/db'
import client from './lib/db/client'
import User from './lib/db/models/user.model'
import { checkRateLimit } from './lib/rate-limit'

import NextAuth, { type DefaultSession } from 'next-auth'
import authConfig from './auth.config'
import { NODE_ENV } from './lib/constants'

declare module 'next-auth' {
  interface Session {
    user: {
      role: string
    } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  pages: {
    signIn: '/sign-in',
    newUser: '/sign-up',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 minutes
    updateAge: 5 * 60, // 5 minutes
  },
  adapter: MongoDBAdapter(client),
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: NODE_ENV,
      },
    },
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
        twoFactorCode: { type: 'text' },
      },
      async authorize(credentials, req) {
        await connectToDatabase()
        if (credentials == null) return null

        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'

        const { success } = await checkRateLimit(ip, 'signin')
        if (!success) {
          throw new Error('TOO_MANY_REQUESTS')
        }

        const user = await User.findOne({ email: credentials.email })

        if (!user || !user.password) return null

        if (user && user.password) {
          const isMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          )
          if (!isMatch) return null
        }

        // ✅ Enforce email verification
        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED')
        }

        // 🧠 Password is correct — now check 2FA
        if (user.isTwoFactorEnabled) {
          if (!credentials.twoFactorCode) {
            throw new Error('TWO_FACTOR_CODE_REQUIRED')
          }

          const speakeasy = await import('speakeasy')

          const isValid2FA = speakeasy.totp.verify({
            secret: user.twoFactorSecret as string,
            encoding: 'base32',
            token: credentials.twoFactorCode as string,
            window: 1,
          })

          if (!isValid2FA) {
            throw new Error('INVALID_TWO_FACTOR_CODE')
          }
        }

        // 🎯 Passed password and 2FA checks
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      await connectToDatabase()
      // If the user just signed in
      if (user) {
        token.role = (user as { role: string }).role
        token.name = user.name || user.email!.split('@')[0]
      } else if (token?.sub) {
        // 🔁 Always fetch role from DB using token.sub (user ID)
        const dbUser = await User.findById(token.sub).select('role')
        if (dbUser) {
          token.role = dbUser.role
        }
      }

      // Optional: if session update is triggered
      if (trigger === 'update' && session?.user?.name) {
        token.name = session.user.name
      }

      return token
    },
    session: async ({ session, user, trigger, token }) => {
      session.user.id = token.sub as string
      session.user.role = token.role as string
      session.user.name = token.name
      if (trigger === 'update') {
        session.user.name = user.name
      }
      return session
    },
  },
})

