"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function requireSuperadmin() {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" } as const
  if (session.user.role !== "SUPERADMIN") return { error: "Tidak punya izin" } as const
  return { session } as const
}

export async function createPosyandu(formData: FormData) {
  const auth_ = await requireSuperadmin()
  if ("error" in auth_) return { error: auth_.error }

  const nama      = formData.get("nama") as string
  const desa      = formData.get("desa") as string
  const kecamatan = formData.get("kecamatan") as string
  const kabupaten = formData.get("kabupaten") as string
  const provinsi  = (formData.get("provinsi") as string) || "NUSA TENGGARA BARAT"

  if (!nama || !desa || !kecamatan || !kabupaten) return { error: "Field wajib belum diisi" }

  try {
    await prisma.posyandu.create({ data: { nama, desa, kecamatan, kabupaten, provinsi } })
    revalidatePath("/superadmin/posyandu")
    revalidatePath("/superadmin/dashboard")
    return { success: true }
  } catch {
    return { error: "Gagal menyimpan data posyandu" }
  }
}

export async function updatePosyandu(id: string, formData: FormData) {
  const auth_ = await requireSuperadmin()
  if ("error" in auth_) return { error: auth_.error }

  const nama      = formData.get("nama") as string
  const desa      = formData.get("desa") as string
  const kecamatan = formData.get("kecamatan") as string
  const kabupaten = formData.get("kabupaten") as string
  const provinsi  = (formData.get("provinsi") as string) || "NUSA TENGGARA BARAT"

  if (!nama || !desa || !kecamatan || !kabupaten) return { error: "Field wajib belum diisi" }

  try {
    await prisma.posyandu.update({
      where: { id },
      data: { nama, desa, kecamatan, kabupaten, provinsi },
    })
    revalidatePath("/superadmin/posyandu")
    revalidatePath("/superadmin/dashboard")
    return { success: true }
  } catch {
    return { error: "Gagal memperbarui data posyandu" }
  }
}

export async function toggleActivePosyandu(id: string) {
  const auth_ = await requireSuperadmin()
  if ("error" in auth_) return { error: auth_.error }

  try {
    const p = await prisma.posyandu.findUnique({ where: { id } })
    if (!p) return { error: "Posyandu tidak ditemukan" }
    await prisma.posyandu.update({ where: { id }, data: { isActive: !p.isActive } })
    revalidatePath("/superadmin/posyandu")
    revalidatePath("/superadmin/dashboard")
    return { success: true }
  } catch {
    return { error: "Gagal mengubah status posyandu" }
  }
}
