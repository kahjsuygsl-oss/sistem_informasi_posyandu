"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { hitungZScore, rentangWajar } from "@/lib/zscore"

export interface ImportBalitaRow {
  namaLengkap: string
  nik: string
  tanggalLahir: string // YYYY-MM-DD
  jenisKelamin: string // L | P
  namaOrangTua: string
  dusun: string
  alamat: string
  beratBadan: string
  tinggiBadan: string
  lila: string
}

export interface ImportResult {
  successCount: number
  errorCount: number
  errors: { row: number; nama: string; reason: string }[]
}

function umurBulanAntara(tanggalLahir: Date, tanggalPeriksa: Date) {
  return (
    (tanggalPeriksa.getFullYear() - tanggalLahir.getFullYear()) * 12 +
    (tanggalPeriksa.getMonth() - tanggalLahir.getMonth())
  )
}

export async function importBalitaBulk(rows: ImportBalitaRow[], tanggalPeriksa: string) {
  const session = await auth()
  if (!session?.user) return { error: "Tidak terautentikasi" } as const

  const posyanduId = session.user.posyanduId
  if (!posyanduId) return { error: "User tidak terhubung ke posyandu" } as const

  const result: ImportResult = { successCount: 0, errorCount: 0, errors: [] }
  const tglPeriksa = new Date(tanggalPeriksa)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNo = i + 1
    try {
      const namaLengkap = row.namaLengkap.trim()
      const namaOrangTua = row.namaOrangTua.trim()
      const jenisKelamin = row.jenisKelamin.trim().toUpperCase()
      const tanggalLahir = new Date(row.tanggalLahir)

      if (!namaLengkap || !namaOrangTua) {
        throw new Error("Nama lengkap / nama orang tua kosong")
      }
      if (jenisKelamin !== "L" && jenisKelamin !== "P") {
        throw new Error(`Jenis kelamin tidak valid: "${row.jenisKelamin}"`)
      }
      if (isNaN(tanggalLahir.getTime())) {
        throw new Error(`Tanggal lahir tidak valid: "${row.tanggalLahir}"`)
      }

      const balita = await prisma.balita.create({
        data: {
          namaLengkap,
          nik: row.nik.trim() || null,
          tanggalLahir,
          jenisKelamin,
          namaOrangTua,
          dusun: row.dusun.trim() || null,
          alamat: row.alamat.trim() || null,
          posyanduId,
        },
      })

      // Kalau BB & TB terisi, langsung buat 1 data pemeriksaan awal
      const beratBadan = parseFloat(row.beratBadan)
      const tinggiBadan = parseFloat(row.tinggiBadan)
      const lila = row.lila ? parseFloat(row.lila) : null

      if (!isNaN(beratBadan) && !isNaN(tinggiBadan)) {
        const umurBulan = umurBulanAntara(tanggalLahir, tglPeriksa)
        const posisiUkur = umurBulan < 24 ? "TERLENTANG" : "BERDIRI"

        if (umurBulan >= 0 && umurBulan <= 60) {
          const rentang = rentangWajar(umurBulan, jenisKelamin as "L" | "P")
          const diLuarRentang =
            (rentang.beratMin !== null && (beratBadan < rentang.beratMin || beratBadan > rentang.beratMax!)) ||
            (rentang.tinggiMin !== null && (tinggiBadan < rentang.tinggiMin || tinggiBadan > rentang.tinggiMax!))

          if (!diLuarRentang) {
            const zscore = hitungZScore(beratBadan, tinggiBadan, umurBulan, jenisKelamin as "L" | "P", posisiUkur)
            await prisma.pemeriksaanBalita.create({
              data: {
                balitaId: balita.id,
                kaderId: session.user.id,
                tanggalPeriksa: tglPeriksa,
                umurBulan,
                beratBadan,
                tinggiBadan,
                posisiUkur,
                lingkarLengan: lila && !isNaN(lila) ? lila : null,
                zScoreBBU: zscore.zBBU,
                zScoreTBU: zscore.zTBU,
                zScoreBBTB: zscore.zBBTB,
                statusBBU: zscore.statusBBU,
                statusStunting: zscore.statusStunting,
                statusGizi: zscore.statusGizi,
              },
            })
          }
        }
      }

      result.successCount++
    } catch (e: any) {
      result.errorCount++
      result.errors.push({
        row: rowNo,
        nama: row.namaLengkap || "(tanpa nama)",
        reason: e.code === "P2002" ? "NIK sudah terdaftar" : e.message || "Gagal menyimpan",
      })
    }
  }

  revalidatePath("/admin/balita")
  revalidatePath("/kader/balita")
  revalidatePath("/admin/dashboard")
  revalidatePath("/kader/dashboard")
  revalidatePath("/superadmin/dashboard")

  return { success: true, result } as const
}
