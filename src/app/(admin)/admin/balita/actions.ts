"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// ─── CREATE ────────────────────────────────────────────────────────────────

export async function createBalita(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }

  const posyanduId = session.user.posyanduId
  if (!posyanduId) return { error: "User tidak terhubung ke posyandu" }

  const namaLengkap  = formData.get("namaLengkap") as string
  const nik          = formData.get("nik") as string | null
  const tanggalLahir = formData.get("tanggalLahir") as string
  const jenisKelamin = formData.get("jenisKelamin") as string
  const namaOrangTua = formData.get("namaOrangTua") as string
  const dusun        = formData.get("dusun") as string | null
  const alamat       = formData.get("alamat") as string | null

  if (!namaLengkap || !tanggalLahir || !jenisKelamin || !namaOrangTua) {
    return { error: "Field wajib belum diisi" }
  }

  try {
    await prisma.balita.create({
      data: {
        namaLengkap,
        nik: nik || null,
        tanggalLahir: new Date(tanggalLahir),
        jenisKelamin,
        namaOrangTua,
        dusun: dusun || null,
        alamat: alamat || null,
        posyanduId,
      },
    })

    revalidatePath("/admin/balita")
    revalidatePath("/kader/balita")
    revalidatePath("/kader/dashboard")
    return { success: true }
  } catch (e: any) {
    if (e.code === "P2002") return { error: "NIK sudah terdaftar" }
    return { error: "Gagal menyimpan data" }
  }
}

// ─── UPDATE ────────────────────────────────────────────────────────────────

export async function updateBalita(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }
  if (session.user.role === "KADER") return { error: "Tidak punya izin mengubah data" }

  const namaLengkap  = formData.get("namaLengkap") as string
  const nik          = formData.get("nik") as string | null
  const tanggalLahir = formData.get("tanggalLahir") as string
  const jenisKelamin = formData.get("jenisKelamin") as string
  const namaOrangTua = formData.get("namaOrangTua") as string
  const dusun        = formData.get("dusun") as string | null
  const alamat       = formData.get("alamat") as string | null

  if (!namaLengkap || !tanggalLahir || !jenisKelamin || !namaOrangTua) {
    return { error: "Field wajib belum diisi" }
  }

  try {
    await prisma.balita.update({
      where: { id },
      data: {
        namaLengkap,
        nik: nik || null,
        tanggalLahir: new Date(tanggalLahir),
        jenisKelamin,
        namaOrangTua,
        dusun: dusun || null,
        alamat: alamat || null,
      },
    })

    revalidatePath("/admin/balita")
    revalidatePath("/kader/balita")
    revalidatePath(`/admin/balita/${id}`)
    revalidatePath(`/kader/balita/${id}`)
    return { success: true }
  } catch (e: any) {
    if (e.code === "P2002") return { error: "NIK sudah terdaftar" }
    return { error: "Gagal memperbarui data" }
  }
}

// ─── DELETE ────────────────────────────────────────────────────────────────

export async function deleteBalita(id: string) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }
  if (session.user.role === "KADER") return { error: "Tidak punya izin menghapus data" }

  try {
    // Soft delete
    await prisma.balita.update({
      where: { id },
      data: { isAktif: false },
    })

    revalidatePath("/admin/balita")
    revalidatePath("/kader/balita")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus data" }
  }
}
