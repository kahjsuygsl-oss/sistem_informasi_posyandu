"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

function revalidateBumilPages(bumilId: string) {
  revalidatePath("/admin/bumil")
  revalidatePath(`/admin/bumil/${bumilId}`)
  revalidatePath("/kader/bumil")
  revalidatePath(`/kader/bumil/${bumilId}`)
}

export async function createPemeriksaanBumil(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }

  const bumilId        = formData.get("bumilId") as string
  const tanggalPeriksa  = formData.get("tanggalPeriksa") as string
  const usiaKandungan   = formData.get("usiaKandungan") ? parseInt(formData.get("usiaKandungan") as string, 10) : null
  const beratBadan      = formData.get("beratBadan") ? parseFloat(formData.get("beratBadan") as string) : null
  const tinggiBadan     = formData.get("tinggiBadan") ? parseFloat(formData.get("tinggiBadan") as string) : null
  const lingkarLengan   = formData.get("lingkarLengan") ? parseFloat(formData.get("lingkarLengan") as string) : null
  const tekananDarah    = (formData.get("tekananDarah") as string) || null
  const catatan         = (formData.get("catatan") as string) || null

  if (!bumilId || !tanggalPeriksa) return { error: "Field wajib belum diisi" }

  // IMT = BB(kg) / TB(m)^2
  const imt = beratBadan && tinggiBadan
    ? Math.round((beratBadan / Math.pow(tinggiBadan / 100, 2)) * 10) / 10
    : null

  // KEK (Kekurangan Energi Kronik): LILA < 23.5 cm — ambang baku Kemenkes RI
  const statusKek = lingkarLengan !== null ? lingkarLengan < 23.5 : false

  try {
    await prisma.pemeriksaanBumil.create({
      data: {
        bumilId,
        kaderId: session.user.id,
        tanggalPeriksa: new Date(tanggalPeriksa),
        usiaKandungan,
        beratBadan,
        tinggiBadan,
        lingkarLengan,
        imt,
        tekananDarah,
        statusKek,
        catatan,
      },
    })
    revalidateBumilPages(bumilId)
    return { success: true }
  } catch {
    return { error: "Gagal menyimpan data pemeriksaan" }
  }
}

export async function deletePemeriksaanBumil(id: string, bumilId: string) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }
  if (session.user.role === "KADER") return { error: "Tidak punya izin menghapus data" }

  try {
    await prisma.pemeriksaanBumil.delete({ where: { id } })
    revalidateBumilPages(bumilId)
    return { success: true }
  } catch {
    return { error: "Gagal menghapus data" }
  }
}
