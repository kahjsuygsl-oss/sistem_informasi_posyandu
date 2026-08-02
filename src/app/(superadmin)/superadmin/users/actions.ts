"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const VALID_ROLES = ["KADER", "ADMIN", "SUPERADMIN"]

function revalidateUserPages() {
  revalidatePath("/superadmin/users")
  revalidatePath("/admin/kader")
}

export async function createUser(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }
  const actorRole = session.user.role

  const name     = formData.get("name") as string
  const email    = formData.get("email") as string
  const password = formData.get("password") as string
  let role       = formData.get("role") as string
  let posyanduId = (formData.get("posyanduId") as string) || null

  if (!name || !email || !password) return { error: "Field wajib belum diisi" }
  if (password.length < 6) return { error: "Kata sandi minimal 6 karakter" }

  if (actorRole === "ADMIN") {
    // Admin hanya boleh membuat akun Kader untuk posyandu miliknya sendiri
    role = "KADER"
    posyanduId = session.user.posyanduId ?? null
    if (!posyanduId) return { error: "Admin tidak terhubung ke posyandu" }
  } else if (actorRole === "SUPERADMIN") {
    if (!VALID_ROLES.includes(role)) return { error: "Peran tidak valid" }
    if (role !== "SUPERADMIN" && !posyanduId) return { error: "Posyandu wajib dipilih untuk peran ini" }
  } else {
    return { error: "Tidak punya izin membuat akun" }
  }

  try {
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: { name, email, password: hashed, role, posyanduId },
    })
    revalidateUserPages()
    return { success: true }
  } catch (e: any) {
    if (e.code === "P2002") return { error: "Email sudah terdaftar" }
    return { error: "Gagal membuat akun" }
  }
}

export async function updateUser(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }
  const actorRole = session.user.role

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return { error: "Akun tidak ditemukan" }

  const name  = formData.get("name") as string
  const email = formData.get("email") as string
  let role       = formData.get("role") as string
  let posyanduId = (formData.get("posyanduId") as string) || null

  if (!name || !email) return { error: "Field wajib belum diisi" }

  if (actorRole === "ADMIN") {
    if (target.role !== "KADER" || target.posyanduId !== session.user.posyanduId) {
      return { error: "Tidak punya izin mengubah akun ini" }
    }
    role = "KADER"
    posyanduId = session.user.posyanduId ?? null
  } else if (actorRole === "SUPERADMIN") {
    if (!VALID_ROLES.includes(role)) return { error: "Peran tidak valid" }
    if (role !== "SUPERADMIN" && !posyanduId) return { error: "Posyandu wajib dipilih untuk peran ini" }
  } else {
    return { error: "Tidak punya izin mengubah akun" }
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { name, email, role, posyanduId },
    })
    revalidateUserPages()
    return { success: true }
  } catch (e: any) {
    if (e.code === "P2002") return { error: "Email sudah terdaftar" }
    return { error: "Gagal memperbarui akun" }
  }
}

export async function toggleActiveUser(id: string) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return { error: "Akun tidak ditemukan" }

  if (session.user.role === "ADMIN") {
    if (target.role !== "KADER" || target.posyanduId !== session.user.posyanduId) {
      return { error: "Tidak punya izin mengubah akun ini" }
    }
  } else if (session.user.role !== "SUPERADMIN") {
    return { error: "Tidak punya izin mengubah akun" }
  }

  if (target.id === session.user.id) return { error: "Tidak bisa menonaktifkan akun sendiri" }

  try {
    await prisma.user.update({ where: { id }, data: { isActive: !target.isActive } })
    revalidateUserPages()
    return { success: true }
  } catch {
    return { error: "Gagal mengubah status akun" }
  }
}

export async function resetUserPassword(id: string, newPassword: string) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }
  if (newPassword.length < 6) return { error: "Kata sandi minimal 6 karakter" }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return { error: "Akun tidak ditemukan" }

  if (session.user.role === "ADMIN") {
    if (target.role !== "KADER" || target.posyanduId !== session.user.posyanduId) {
      return { error: "Tidak punya izin mengubah akun ini" }
    }
  } else if (session.user.role !== "SUPERADMIN") {
    return { error: "Tidak punya izin mengubah akun" }
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id }, data: { password: hashed } })
    return { success: true }
  } catch {
    return { error: "Gagal mereset kata sandi" }
  }
}
