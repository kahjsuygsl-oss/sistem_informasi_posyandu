import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 jam — sesuai NFR keamanan (sesi login punya batas waktu)
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { posyandu: true },
        })

        if (!user || !user.isActive) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          posyanduId: user.posyanduId ?? undefined,
          posyanduNama: user.posyandu?.nama ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.posyanduId = (user as any).posyanduId
        token.posyanduNama = (user as any).posyanduNama
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.posyanduId = token.posyanduId as string | undefined
        session.user.posyanduNama = token.posyanduNama as string | undefined
      }
      return session
    },
  },
  // FR-04: catat log aktivitas login/logout pengguna
  events: {
    async signIn({ user }) {
      if (user?.id) {
        await prisma.activityLog.create({ data: { userId: user.id, action: "LOGIN" } })
      }
    },
    async signOut(message) {
      const userId = "token" in message ? (message.token?.id as string | undefined) : undefined
      if (userId) {
        await prisma.activityLog.create({ data: { userId, action: "LOGOUT" } })
      }
    },
  },
})
