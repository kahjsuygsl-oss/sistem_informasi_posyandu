"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { hitungZScore, rentangWajar } from "@/lib/zscore"

export async function createPemeriksaan(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }

  const balitaId     = formData.get("balitaId") as string
  const tanggalPeriksa = formData.get("tanggalPeriksa") as string
  const beratBadan   = parseFloat(formData.get("beratBadan") as string)
  const tinggiBadan  = parseFloat(formData.get("tinggiBadan") as string)
  const posisiUkur   = (formData.get("posisiUkur") as string) || "TERLENTANG"
  const lingkarKepala = formData.get("lingkarKepala")
    ? parseFloat(formData.get("lingkarKepala") as string)
    : null
  const lingkarLengan = formData.get("lingkarLengan")
    ? parseFloat(formData.get("lingkarLengan") as string)
    : null
  const catatan = (formData.get("catatan") as string) || null

  if (!balitaId || !tanggalPeriksa || isNaN(beratBadan) || isNaN(tinggiBadan)) {
    return { error: "Field wajib belum diisi" }
  }

  // Ambil data balita untuk hitung umur & jenis kelamin
  const balita = await prisma.balita.findUnique({
    where: { id: balitaId },
    select: { tanggalLahir: true, jenisKelamin: true },
  })
  if (!balita) return { error: "Balita tidak ditemukan" }

  // Hitung umur dalam bulan saat tanggal periksa
  const tglPeriksa = new Date(tanggalPeriksa)
  const tglLahir   = new Date(balita.tanggalLahir)
  const umurBulan  =
    (tglPeriksa.getFullYear() - tglLahir.getFullYear()) * 12 +
    (tglPeriksa.getMonth()    - tglLahir.getMonth())

  // FR-12: validasi rentang nilai wajar BB/TB sesuai umur (pertahanan sisi server)
  if (umurBulan >= 0 && umurBulan <= 60) {
    const rentang = rentangWajar(umurBulan, balita.jenisKelamin as "L" | "P")
    if (
      (rentang.beratMin !== null && (beratBadan < rentang.beratMin || beratBadan > rentang.beratMax!)) ||
      (rentang.tinggiMin !== null && (tinggiBadan < rentang.tinggiMin || tinggiBadan > rentang.tinggiMax!))
    ) {
      return { error: "Berat/tinggi badan di luar rentang wajar untuk umur balita ini. Periksa kembali input Anda." }
    }
  }

  // Hitung Z-Score otomatis
  const zscore = hitungZScore(
    beratBadan,
    tinggiBadan,
    umurBulan,
    balita.jenisKelamin as "L" | "P",
    posisiUkur as "BERDIRI" | "TERLENTANG"
  )

  try {
    await prisma.pemeriksaanBalita.create({
      data: {
        balitaId,
        kaderId:       session.user.id,
        tanggalPeriksa: tglPeriksa,
        umurBulan,
        beratBadan,
        tinggiBadan,
        posisiUkur,
        lingkarKepala,
        lingkarLengan,
        zScoreBBU:     zscore.zBBU,
        zScoreTBU:     zscore.zTBU,
        zScoreBBTB:    zscore.zBBTB,
        statusBBU:      zscore.statusBBU,
        statusStunting: zscore.statusStunting,
        statusGizi:     zscore.statusGizi,
        catatan,
      },
    })

    revalidatePath("/admin/balita")
    revalidatePath(`/admin/balita/${balitaId}`)
    revalidatePath("/admin/pemeriksaan")
    revalidatePath("/admin/dashboard")
    revalidatePath("/kader/balita")
    revalidatePath(`/kader/balita/${balitaId}`)
    revalidatePath("/kader/pemeriksaan")
    revalidatePath("/kader/dashboard")
    revalidatePath("/superadmin/dashboard")
    return { success: true, zscore }
  } catch {
    return { error: "Gagal menyimpan data pemeriksaan" }
  }
}

export async function deletePemeriksaan(id: string) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" }
  if (session.user.role === "KADER") return { error: "Tidak punya izin menghapus data" }

  try {
    await prisma.pemeriksaanBalita.delete({ where: { id } })
    revalidatePath("/admin/pemeriksaan")
    revalidatePath("/admin/dashboard")
    revalidatePath("/kader/pemeriksaan")
    revalidatePath("/kader/dashboard")
    revalidatePath("/superadmin/dashboard")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus data" }
  }
}
