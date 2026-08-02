"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export interface ImportBumilRow {
  namaLengkap: string
  nik: string
  namaSuami: string
  tanggalLahir: string // YYYY-MM-DD, opsional
  dusun: string
  alamat: string
  hpht: string // YYYY-MM-DD, opsional
  hpl: string // YYYY-MM-DD, opsional
  kehamilanKe: string
  paritas: string
  abortus: string
  beratBadan: string
  tinggiBadan: string
  lila: string
  imt: string // opsional, kalau kosong dihitung dari BB/TB
  statusKekText: string // teks asli, mis. "Tidak KEK" / "KEK" — kosong = tidak diketahui
  tekananDarah: string
  catatan: string
}

export interface ImportResult {
  successCount: number
  errorCount: number
  errors: { row: number; nama: string; reason: string }[]
}

// Usia kandungan (minggu) dihitung dari HPHT relatif terhadap tanggal periksa —
// bukan dari kolom "Usia Saat Hamil" di file sumber (itu usia IBU, bukan usia kandungan).
function hitungUsiaKandunganMinggu(hpht: Date | null, tglPeriksa: Date): number | null {
  if (!hpht) return null
  const hari = Math.floor((tglPeriksa.getTime() - hpht.getTime()) / (1000 * 60 * 60 * 24))
  if (hari < 0) return null
  return Math.floor(hari / 7)
}

function parseStatusKekText(value: string): boolean | null {
  const v = value.trim().toLowerCase()
  if (!v) return null
  if (v.includes("tidak")) return false
  if (v.includes("kek")) return true
  return null
}

export async function importBumilBulk(rows: ImportBumilRow[], tanggalPeriksa: string) {
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
      if (!namaLengkap) throw new Error("Nama lengkap kosong")

      const tanggalLahir = row.tanggalLahir ? new Date(row.tanggalLahir) : null
      if (row.tanggalLahir && isNaN(tanggalLahir!.getTime())) {
        throw new Error(`Tanggal lahir tidak valid: "${row.tanggalLahir}"`)
      }
      const hpht = row.hpht ? new Date(row.hpht) : null
      if (row.hpht && isNaN(hpht!.getTime())) throw new Error(`HPHT tidak valid: "${row.hpht}"`)
      const hpl = row.hpl ? new Date(row.hpl) : null
      if (row.hpl && isNaN(hpl!.getTime())) throw new Error(`HPL tidak valid: "${row.hpl}"`)

      const usiaKehamilan = hitungUsiaKandunganMinggu(hpht, tglPeriksa)

      const bumil = await prisma.bumil.create({
        data: {
          namaLengkap,
          nik: row.nik.trim() || null,
          namaSuami: row.namaSuami.trim() || null,
          tanggalLahir,
          dusun: row.dusun.trim() || null,
          alamat: row.alamat.trim() || null,
          usiaKehamilan,
          hpht,
          hpl,
          posyanduId,
        },
      })

      const beratBadan = row.beratBadan ? parseFloat(row.beratBadan) : null
      const tinggiBadan = row.tinggiBadan ? parseFloat(row.tinggiBadan) : null
      const lila = row.lila ? parseFloat(row.lila) : null
      const kehamilanKe = row.kehamilanKe ? parseInt(row.kehamilanKe, 10) : null
      const paritas = row.paritas ? parseInt(row.paritas, 10) : null
      const abortus = row.abortus ? parseInt(row.abortus, 10) : null
      const imtProvided = row.imt ? parseFloat(row.imt) : null

      const adaDataPemeriksaan =
        (beratBadan && !isNaN(beratBadan)) || (tinggiBadan && !isNaN(tinggiBadan)) || hpht

      if (adaDataPemeriksaan) {
        const imt = imtProvided && !isNaN(imtProvided)
          ? imtProvided
          : beratBadan && tinggiBadan && !isNaN(beratBadan) && !isNaN(tinggiBadan)
            ? Math.round((beratBadan / Math.pow(tinggiBadan / 100, 2)) * 10) / 10
            : null

        const statusKekDariTeks = parseStatusKekText(row.statusKekText)
        const statusKek = statusKekDariTeks !== null
          ? statusKekDariTeks
          : (lila !== null && !isNaN(lila) ? lila < 23.5 : false)

        await prisma.pemeriksaanBumil.create({
          data: {
            bumilId: bumil.id,
            kaderId: session.user.id,
            tanggalPeriksa: tglPeriksa,
            usiaKandungan: usiaKehamilan,
            kehamilanKe: kehamilanKe !== null && !isNaN(kehamilanKe) ? kehamilanKe : null,
            paritas: paritas !== null && !isNaN(paritas) ? paritas : null,
            abortus: abortus !== null && !isNaN(abortus) ? abortus : null,
            hpht,
            hpl,
            beratBadan: beratBadan && !isNaN(beratBadan) ? beratBadan : null,
            tinggiBadan: tinggiBadan && !isNaN(tinggiBadan) ? tinggiBadan : null,
            lingkarLengan: lila && !isNaN(lila) ? lila : null,
            imt,
            tekananDarah: row.tekananDarah.trim() || null,
            statusKek,
            catatan: row.catatan.trim() || null,
          },
        })
      }

      result.successCount++
    } catch (e: any) {
      result.errorCount++
      result.errors.push({
        row: rowNo,
        nama: row.namaLengkap || "(tanpa nama)",
        reason: e.message || "Gagal menyimpan",
      })
    }
  }

  revalidatePath("/admin/bumil")
  revalidatePath("/kader/bumil")
  revalidatePath("/kader/dashboard")

  return { success: true, result } as const
}
