// Kalkulasi Z-Score menggunakan metode LMS WHO
// Formula: Z = [(X/M)^L - 1] / (L * S)
// Jika L mendekati 0: Z = ln(X/M) / S

import { WHO_BBU_L, WHO_BBU_P, type LMSRow } from "./who-bbu"
import { WHO_TBU_L, WHO_TBU_P } from "./who-tbu"
import { WHO_BBTB_L, WHO_BBTB_L_STANDING } from "./who-bbtb-boys"
import { WHO_BBTB_P, WHO_BBTB_P_STANDING } from "./who-bbtb-girls"

// ── Core LMS formula ────────────────────────────────────────────────────────

function calcZScore(X: number, L: number, M: number, S: number): number {
  let z: number
  if (Math.abs(L) < 0.01) {
    z = Math.log(X / M) / S
  } else {
    z = (Math.pow(X / M, L) - 1) / (L * S)
  }
  // WHO cap: jika |z| > 3, koreksi dengan SD3
  if (z > 3) {
    const sd3pos = M * Math.pow(1 + L * S * 3, 1 / L)
    const sd23   = sd3pos - M * Math.pow(1 + L * S * 2, 1 / L)
    z = 3 + (X - sd3pos) / sd23
  } else if (z < -3) {
    const sd3neg = M * Math.pow(1 + L * S * (-3), 1 / L)
    const sd23   = M * Math.pow(1 + L * S * (-2), 1 / L) - sd3neg
    z = -3 + (X - sd3neg) / sd23
  }
  return Math.round(z * 100) / 100
}

function getLMSByMonth(table: LMSRow[], month: number): LMSRow | null {
  const clamped = Math.max(0, Math.min(60, Math.round(month)))
  return table.find((r) => r.month === clamped) ?? null
}

// Kebalikan formula LMS: cari nilai X pada Z tertentu (dipakai untuk validasi rentang wajar)
function zToValue(z: number, L: number, M: number, S: number): number {
  if (Math.abs(L) < 0.01) return M * Math.exp(S * z)
  return M * Math.pow(1 + L * S * z, 1 / L)
}

function getLMSByHeight(
  table: { height: number; L: number; M: number; S: number }[],
  height: number
): { L: number; M: number; S: number } | null {
  const min = table[0].height
  const max = table[table.length - 1].height
  const h = Math.max(min, Math.min(max, Math.round(height)))

  const exact = table.find((r) => r.height === h)
  if (exact) return exact

  // Interpolasi linear jika tidak tepat
  const lower = table.filter((r) => r.height <= h).at(-1)
  const upper = table.find((r) => r.height > h)
  if (!lower || !upper) return null

  const t = (h - lower.height) / (upper.height - lower.height)
  return {
    L: lower.L + t * (upper.L - lower.L),
    M: lower.M + t * (upper.M - lower.M),
    S: lower.S + t * (upper.S - lower.S),
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface ZScoreResult {
  zBBU:  number | null   // Berat Badan / Umur
  zTBU:  number | null   // Tinggi Badan / Umur
  zBBTB: number | null   // Berat Badan / Tinggi Badan

  // Klasifikasi per indikator (PRD §8)
  statusBBU:      string | null  // §8.3 — kategori berat badan menurut umur
  statusStunting: string | null  // §8.2 — kategori tinggi badan menurut umur (deteksi stunting)
  statusGizi:     string | null  // §8.4 — status gizi utama (berat badan menurut tinggi badan)
}

export function hitungZScore(
  beratBadan: number,   // kg
  tinggiBadan: number,  // cm
  umurBulan: number,
  jenisKelamin: "L" | "P",
  // Metode ukur menentukan kurva BB/TB WHO yang dipakai (beda kurva, bukan cuma beda rentang):
  //  - TERLENTANG -> weight-for-length (0-2 th, panjang rebah, 45-110 cm)
  //  - BERDIRI    -> weight-for-height (2-5 th, tinggi berdiri, 65-120 cm)
  posisiUkur: "BERDIRI" | "TERLENTANG" = "TERLENTANG"
): ZScoreResult {
  const isL = jenisKelamin === "L"

  // BB/U
  const lmsBBU = getLMSByMonth(isL ? WHO_BBU_L : WHO_BBU_P, umurBulan)
  const zBBU = lmsBBU
    ? calcZScore(beratBadan, lmsBBU.L, lmsBBU.M, lmsBBU.S)
    : null

  // TB/U
  const lmsTBU = getLMSByMonth(isL ? WHO_TBU_L : WHO_TBU_P, umurBulan)
  const zTBU = lmsTBU
    ? calcZScore(tinggiBadan, lmsTBU.L, lmsTBU.M, lmsTBU.S)
    : null

  // BB/TB — pilih kurva sesuai posisi ukur
  const tabelBBTB = posisiUkur === "BERDIRI"
    ? (isL ? WHO_BBTB_L_STANDING : WHO_BBTB_P_STANDING)
    : (isL ? WHO_BBTB_L : WHO_BBTB_P)
  const lmsBBTB = getLMSByHeight(tabelBBTB, tinggiBadan)
  const zBBTB = lmsBBTB
    ? calcZScore(beratBadan, lmsBBTB.L, lmsBBTB.M, lmsBBTB.S)
    : null

  return {
    zBBU,
    zTBU,
    zBBTB,
    statusBBU:      zBBU  !== null ? klasifikasiBBU(zBBU)         : null,
    statusStunting: zTBU  !== null ? klasifikasiStunting(zTBU)    : null,
    statusGizi:     zBBTB !== null ? klasifikasiGizi(zBBTB)       : null,
  }
}

// FR-12: rentang nilai wajar BB/TB sesuai umur (±5 SD dari kurva WHO BB/U & TB/U —
// jauh lebih longgar dari ambang klasifikasi ±3SD, supaya balita gizi buruk/stunting
// berat sungguhan tetap bisa disimpan; hanya menangkap salah ketik/kesalahan input).
export interface RentangWajar {
  beratMin: number | null
  beratMax: number | null
  tinggiMin: number | null
  tinggiMax: number | null
}

export function rentangWajar(umurBulan: number, jenisKelamin: "L" | "P"): RentangWajar {
  const isL = jenisKelamin === "L"
  const lmsBBU = getLMSByMonth(isL ? WHO_BBU_L : WHO_BBU_P, umurBulan)
  const lmsTBU = getLMSByMonth(isL ? WHO_TBU_L : WHO_TBU_P, umurBulan)

  return {
    beratMin:  lmsBBU ? Math.round(zToValue(-5, lmsBBU.L, lmsBBU.M, lmsBBU.S) * 10) / 10 : null,
    beratMax:  lmsBBU ? Math.round(zToValue(5,  lmsBBU.L, lmsBBU.M, lmsBBU.S) * 10) / 10 : null,
    tinggiMin: lmsTBU ? Math.round(zToValue(-5, lmsTBU.L, lmsTBU.M, lmsTBU.S) * 10) / 10 : null,
    tinggiMax: lmsTBU ? Math.round(zToValue(5,  lmsTBU.L, lmsTBU.M, lmsTBU.S) * 10) / 10 : null,
  }
}

// ── Klasifikasi (ambang batas persis sesuai PRD §8) ─────────────────────────

// §8.3 — Indikator BB/U
export function klasifikasiBBU(z: number): string {
  if (z < -3) return "BB_SANGAT_KURANG"
  if (z < -2) return "BB_KURANG"
  if (z <= 1) return "BB_NORMAL"
  return "RISIKO_BB_LEBIH"
}

// §8.2 — Indikator TB/U (deteksi utama stunting)
export function klasifikasiStunting(z: number): string {
  if (z < -3) return "SANGAT_PENDEK"
  if (z < -2) return "PENDEK"
  if (z <= 3) return "NORMAL"
  return "TINGGI"
}

// §8.4 — Indikator BB/TB (status gizi utama)
export function klasifikasiGizi(z: number): string {
  if (z < -3) return "GIZI_BURUK"
  if (z < -2) return "GIZI_KURANG"
  if (z <= 1) return "GIZI_BAIK"
  if (z <= 2) return "BERISIKO_GIZI_LEBIH"
  if (z <= 3) return "GIZI_LEBIH"
  return "OBESITAS"
}

// ── Label & Badge ───────────────────────────────────────────────────────────

export function labelBBU(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    BB_SANGAT_KURANG: { label: "Berat Badan Sangat Kurang", cls: "bg-red-100 text-red-700" },
    BB_KURANG:        { label: "Berat Badan Kurang",        cls: "bg-amber-100 text-amber-700" },
    BB_NORMAL:        { label: "Berat Badan Normal",        cls: "bg-green-100 text-green-700" },
    RISIKO_BB_LEBIH:  { label: "Risiko Berat Badan Lebih",  cls: "bg-purple-100 text-purple-700" },
  }
  return map[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" }
}

export function labelStunting(status: string) {
  const map: Record<string, { label: string; cls: string; isStunting: boolean }> = {
    SANGAT_PENDEK: { label: "Sangat Pendek", cls: "bg-red-100 text-red-700",    isStunting: true },
    PENDEK:        { label: "Pendek",        cls: "bg-amber-100 text-amber-700", isStunting: true },
    NORMAL:        { label: "Normal",        cls: "bg-green-100 text-green-700", isStunting: false },
    TINGGI:        { label: "Tinggi",        cls: "bg-blue-100 text-blue-700",   isStunting: false },
  }
  return map[status] ?? { label: status, cls: "bg-gray-100 text-gray-700", isStunting: false }
}

export function labelGizi(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    GIZI_BURUK:           { label: "Gizi Buruk",           cls: "bg-red-100 text-red-700" },
    GIZI_KURANG:          { label: "Gizi Kurang",          cls: "bg-amber-100 text-amber-700" },
    GIZI_BAIK:            { label: "Gizi Baik",            cls: "bg-green-100 text-green-700" },
    BERISIKO_GIZI_LEBIH:  { label: "Berisiko Gizi Lebih",  cls: "bg-purple-100 text-purple-700" },
    GIZI_LEBIH:           { label: "Gizi Lebih",           cls: "bg-purple-100 text-purple-700" },
    OBESITAS:             { label: "Obesitas",             cls: "bg-red-100 text-red-700" },
  }
  return map[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" }
}

// ── Urutan & warna kategori untuk chart (recharts butuh hex, bukan kelas Tailwind) ──

export const GIZI_ORDER = [
  "GIZI_BURUK", "GIZI_KURANG", "GIZI_BAIK",
  "BERISIKO_GIZI_LEBIH", "GIZI_LEBIH", "OBESITAS",
] as const

export const GIZI_CHART_COLOR: Record<string, string> = {
  GIZI_BURUK: "#dc2626",
  GIZI_KURANG: "#d97706",
  GIZI_BAIK: "#16a34a",
  BERISIKO_GIZI_LEBIH: "#a855f7",
  GIZI_LEBIH: "#7c3aed",
  OBESITAS: "#991b1b",
}

export const STUNTING_ORDER = ["SANGAT_PENDEK", "PENDEK", "NORMAL", "TINGGI"] as const

export const STUNTING_CHART_COLOR: Record<string, string> = {
  SANGAT_PENDEK: "#dc2626",
  PENDEK: "#d97706",
  NORMAL: "#16a34a",
  TINGGI: "#2563eb",
}
