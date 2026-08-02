import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      posyanduId?: string
      posyanduNama?: string
    } & DefaultSession["user"]
  }
}
