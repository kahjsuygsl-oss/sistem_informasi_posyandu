import * as XLSX from "xlsx"

// Normalisasi nama kolom: lowercase, buang tanda baca, spasi -> underscore
// "Kehamilan Ke berapa (G)" -> "kehamilan_ke_berapa_g", "Tgl HPHT" -> "tgl_hpht"
export function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

// Parse angka format Indonesia (koma sebagai desimal): "10,9" -> 10.9, "1.234,5" -> 1234.5
export function parseIndonesianNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") return NaN
  if (typeof value === "number") return value
  let s = value.trim()
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".")
  } else if (s.includes(",")) {
    s = s.replace(",", ".")
  }
  return parseFloat(s)
}

// Cari baris header di antara beberapa baris judul/kosong di awal file
// (banyak file posyandu asli punya 1-2 baris judul sheet sebelum header sesungguhnya)
function findHeaderRowIndex(rows: unknown[][], knownTokens: Set<string>): number {
  const maxScan = Math.min(rows.length, 15)
  let bestIdx = 0
  let bestScore = -1
  for (let i = 0; i < maxScan; i++) {
    const row = rows[i] ?? []
    let score = 0
    for (const cell of row) {
      if (cell === null || cell === undefined || cell === "") continue
      if (knownTokens.has(normalizeHeader(String(cell)))) score++
    }
    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  return bestScore >= 2 ? bestIdx : 0
}

// Decode byte CSV ke teks. File posyandu asli sering disimpan Windows-1252 (bukan UTF-8),
// jadi kalau didekode sebagai UTF-8 gagal (byte tidak valid), fallback ke Windows-1252.
function decodeCsvBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(bytes.slice(3))
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder("windows-1252").decode(bytes)
  }
}

// Parser CSV manual (RFC4180-ish): SENGAJA tidak memakai SheetJS untuk .csv karena SheetJS
// menebak tipe data CSV dan merusak angka koma-desimal ("10,9" -> 109) serta tanggal
// (jadi serial number Excel). Semua nilai selalu dikembalikan sebagai string mentah.
function parseCsvText(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let i = 0
  const len = text.length
  while (i < len) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === ",") {
      row.push(field)
      field = ""
      i++
      continue
    }
    if (c === "\r") {
      i++
      continue
    }
    if (c === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      i++
      continue
    }
    field += c
    i++
  }
  row.push(field)
  if (row.length > 1 || row[0] !== "") rows.push(row)
  return rows
}

// Baca file .xlsx/.xls/.csv yang diunggah pengguna, deteksi baris header otomatis,
// kembalikan baris data sebagai objek { header_ternormalisasi: nilai_teks }
export async function parseSpreadsheetFile(
  file: File,
  knownHeaderTokens: string[]
): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer()
  const isCsv = file.name.toLowerCase().endsWith(".csv")

  let rawRows: unknown[][]
  if (isCsv) {
    rawRows = parseCsvText(decodeCsvBuffer(buffer))
  } else {
    const wb = XLSX.read(buffer, { type: "array" })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" })
  }

  const tokenSet = new Set(knownHeaderTokens.map(normalizeHeader))
  const headerIdx = findHeaderRowIndex(rawRows, tokenSet)
  const headers = (rawRows[headerIdx] ?? []).map((h) => normalizeHeader(String(h ?? "")))

  const dataRows = rawRows.slice(headerIdx + 1)
  return dataRows
    .filter((r) => r.some((cell) => cell !== "" && cell !== null && cell !== undefined))
    .map((r) => {
      const out: Record<string, string> = {}
      headers.forEach((h, i) => {
        if (!h) return
        const cell = r[i]
        out[h] = cell === null || cell === undefined ? "" : String(cell).trim()
      })
      return out
    })
}

// Ambil nilai field pertama yang cocok dari daftar alias nama kolom
export function pickAlias(row: Record<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    const key = normalizeHeader(alias)
    if (row[key] !== undefined && row[key] !== "") return row[key]
  }
  return ""
}

// Buat & unduh file template .xlsx berisi header kolom + contoh baris
export function downloadTemplate(filename: string, headers: string[], sampleRow: Record<string, string>) {
  const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Template")
  XLSX.writeFile(wb, filename)
}
