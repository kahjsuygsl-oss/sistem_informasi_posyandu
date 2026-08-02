"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function createBumil(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }

  const posyanduId = session.user.posyanduId
  if (!posyanduId) return { error: "User tidak terhubung ke posyandu" }

  const namaLengkap   = formData.get("namaLengkap") as string
  const nik           = formData.get("nik") as string | null
  const namaSuami     = formData.get("namaSuami") as string | null
  const tanggalLahir  = formData.get("tanggalLahir") as string | null
  const dusun         = formData.get("dusun") as string | null
  const alamat        = formData.get("alamat") as string | null
  const usiaKehamilan = formData.get("usiaKehamilan") as string | null
  const hpht          = formData.get("hpht") as string | null
  const hpl           = formData.get("hpl") as string | null

  if (!namaLengkap) return { error: "Nama lengkap wajib diisi" }

  try {
    await prisma.bumil.create({
      data: {
        namaLengkap,
        nik: nik || null,
        namaSuami: namaSuami || null,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
        dusun: dusun || null,
        alamat: alamat || null,
        usiaKehamilan: usiaKehamilan ? parseInt(usiaKehamilan, 10) : null,
        hpht: hpht ? new Date(hpht) : null,
        hpl: hpl ? new Date(hpl) : null,
        posyanduId,
      },
    })

    revalidatePath("/admin/bumil")
    revalidatePath("/kader/bumil")
    revalidatePath("/kader/dashboard")
    return { success: true }
  } catch {
    return { error: "Gagal menyimpan data" }
  }
}

export async function updateBumil(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }
  if (session.user.role === "KADER") return { error: "Tidak punya izin mengubah data" }

  const namaLengkap   = formData.get("namaLengkap") as string
  const nik           = formData.get("nik") as string | null
  const namaSuami     = formData.get("namaSuami") as string | null
  const tanggalLahir  = formData.get("tanggalLahir") as string | null
  const dusun         = formData.get("dusun") as string | null
  const alamat        = formData.get("alamat") as string | null
  const usiaKehamilan = formData.get("usiaKehamilan") as string | null
  const hpht          = formData.get("hpht") as string | null
  const hpl           = formData.get("hpl") as string | null

  if (!namaLengkap) return { error: "Nama lengkap wajib diisi" }

  try {
    await prisma.bumil.update({
      where: { id },
      data: {
        namaLengkap,
        nik: nik || null,
        namaSuami: namaSuami || null,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
        dusun: dusun || null,
        alamat: alamat || null,
        usiaKehamilan: usiaKehamilan ? parseInt(usiaKehamilan, 10) : null,
        hpht: hpht ? new Date(hpht) : null,
        hpl: hpl ? new Date(hpl) : null,
      },
    })

    revalidatePath("/admin/bumil")
    revalidatePath("/kader/bumil")
    revalidatePath(`/admin/bumil/${id}`)
    revalidatePath(`/kader/bumil/${id}`)
    return { success: true }
  } catch {
    return { error: "Gagal memperbarui data" }
  }
}

export async function deleteBumil(id: string) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }
  if (session.user.role === "KADER") return { error: "Tidak punya izin menghapus data" }

  try {
    await prisma.bumil.update({
      where: { id },
      data: { isAktif: false },
    })

    revalidatePath("/admin/bumil")
    revalidatePath("/kader/bumil")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus data" }
  }
}
