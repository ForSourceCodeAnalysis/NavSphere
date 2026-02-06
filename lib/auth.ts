import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { DefaultSession, NextAuthConfig } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      accessToken?: string
    } & DefaultSession['user']
  }
  interface JWT {
    accessToken?: string
  }
  interface User {
    accessToken?: string
  }
}

// 同时配置两种认证提供者，让用户可以选择
const providers = [
  // GitHub 认证提供者
  GithubProvider({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_SECRET!,
    authorization: {
      params: { scope: 'repo' }
    }
  }),
  // 令牌认证提供者
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      authtoken: { label: "Auth Token", type: "password" }
    },
    async authorize(credentials) {
      const token = process.env.AUTH_TOKEN
      if (token === credentials?.authtoken) {
        return ({id: "1", name: "Admin", email: "admin@navsphere.com", image: '', accessToken: token})
      } else {
        return null
      }     
    }
  })
]

const config = {
  providers,
  callbacks: {
    async jwt({ token, account, user }: any) {
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      if (user?.accessToken) {
        token.accessToken = user.accessToken      
      }
      return token
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.accessToken = token.accessToken as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  secret: process.env.GITHUB_SECRET || process.env.AUTH_TOKEN
} satisfies NextAuthConfig

const handler = NextAuth(config)

export const auth = handler.auth
export const { handlers: { GET, POST } } = handler