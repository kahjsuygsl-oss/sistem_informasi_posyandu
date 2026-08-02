// Definisi kolom impor Excel/CSV — dibuat agar cocok dengan format data lapangan asli
// (lihat data-posyandu/*.csv), dengan alias tambahan untuk penamaan yang lebih ramah.

export const BALITA_FIELD_ALIASES = {
  namaLengkap: ["nama_anak", "nama_lengkap", "nama"],
  nik: ["nik"],
  tanggalLahir: ["tgl_lahir", "tanggal_lahir"],
  jenisKelamin: ["jk", "jenis_kelamin"],
  namaOrangTua: ["nm_ortu", "nama_orang_tua", "nama_ortu"],
  dusun: ["dusun"],
  alamat: ["alamat"],
  beratBadan: ["berat", "berat_badan"],
  tinggiBadan: ["tinggi", "tinggi_badan"],
  lila: ["lila"],
} as const

// Header template mengikuti urutan & penamaan file asli (nama_anak, jk, nm_ortu, BERAT, TINGGI, LILA)
// + kolom tambahan (dusun, alamat, nik) yang dibutuhkan skema tapi tidak ada di file sumber asli.
export const BALITA_TEMPLATE_HEADERS = [
  "no", "nama_anak", "tgl_lahir", "jk", "nm_ortu", "BERAT", "TINGGI", "LILA", "dusun", "alamat", "nik",
]

export const BALITA_TEMPLATE_SAMPLE_ROW: Record<string, string> = {
  no: "1",
  nama_anak: "Contoh Nama Anak",
  tgl_lahir: "2023-01-15",
  jk: "L",
  nm_ortu: "Nama Orang Tua",
  BERAT: "9,5",
  TINGGI: "78",
  LILA: "14,5",
  dusun: "Dasan Busur",
  alamat: "RT 01/RW 02",
  nik: "",
}

// Semua token header yang dikenali (dipakai untuk mendeteksi baris header di file)
export const BALITA_KNOWN_TOKENS = ["no", ...Object.values(BALITA_FIELD_ALIASES).flat()]

export const BUMIL_FIELD_ALIASES = {
  namaLengkap: ["nama", "nama_lengkap"],
  nik: ["nik"],
  namaSuami: ["nama_suami"],
  tanggalLahir: ["tgl_lahir", "tanggal_lahir"],
  dusun: ["dusun"],
  alamat: ["alamat"],
  hpht: ["tgl_hpht", "hpht"],
  hpl: ["tgl_hpl", "hpl"],
  kehamilanKe: ["kehamilan_ke_berapa_g", "kehamilan_ke", "g"],
  paritas: ["paritas_p", "paritas"],
  abortus: ["abortus_a", "abortus"],
  beratBadan: ["berat_badan_sebelum_hamil_kg", "berat_badan", "berat"],
  tinggiBadan: ["tinggi_badan_sebelum_hamil_cm", "tinggi_badan", "tinggi"],
  imt: ["imt"],
  lila: ["lila"],
  statusKekText: ["status_kek_tidak_kek", "status_kek"],
  tekananDarah: ["tekanan_darah"],
  catatan: ["tindakan", "catatan"],
  // "usia_saat_hamil" SENGAJA tidak dipetakan ke usiaKehamilan —
  // di file sumber itu berarti usia ibu ("29 Tahun 0 Bulan 15 Hari"), bukan usia kandungan.
  // Usia kandungan (minggu) dihitung dari HPHT saat impor.
} as const

// Header template mengikuti format file "Daftar Bumil" asli + kolom dusun/alamat tambahan.
export const BUMIL_TEMPLATE_HEADERS = [
  "no", "nik", "nama", "nama_suami", "tgl_lahir", "tgl_hpht", "tgl_hpl",
  "kehamilan_ke_berapa_(g)", "paritas_(p)", "abortus_(a)",
  "berat_badan_sebelum_hamil_(kg)", "tinggi_badan_sebelum_hamil_(cm)", "imt", "lila",
  "status_kek_/_tidak_kek", "tekanan_darah", "dusun", "alamat",
]

export const BUMIL_TEMPLATE_SAMPLE_ROW: Record<string, string> = {
  no: "1",
  nik: "5203205112961824",
  nama: "Contoh Nama Ibu",
  nama_suami: "Nama Suami",
  tgl_lahir: "1996-05-10",
  tgl_hpht: "2026-04-01",
  tgl_hpl: "2027-01-06",
  "kehamilan_ke_berapa_(g)": "2",
  "paritas_(p)": "1",
  "abortus_(a)": "0",
  "berat_badan_sebelum_hamil_(kg)": "58",
  "tinggi_badan_sebelum_hamil_(cm)": "155",
  imt: "24.1",
  lila: "24",
  "status_kek_/_tidak_kek": "Tidak KEK",
  tekanan_darah: "110/70",
  dusun: "Dasan Busur",
  alamat: "RT 01/RW 02",
}

export const BUMIL_KNOWN_TOKENS = ["no", ...Object.values(BUMIL_FIELD_ALIASES).flat()]

export function parseStatusKekText(value: string): boolean | null {
  const v = value.trim().toLowerCase()
  if (!v) return null
  if (v.includes("tidak")) return false
  if (v.includes("kek")) return true
  return null
}
