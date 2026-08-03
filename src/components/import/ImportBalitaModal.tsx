"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { parseSpreadsheetFile, downloadTemplate, pickAlias, parseIndonesianNumber } from "@/lib/xlsxHelpers"
import {
  BALITA_FIELD_ALIASES, BALITA_KNOWN_TOKENS,
  BALITA_TEMPLATE_HEADERS, BALITA_TEMPLATE_SAMPLE_ROW,
} from "@/lib/importSchemas"
import { importBalitaBulk, type ImportBalitaRow, type ImportResult } from "@/app/(admin)/admin/balita/importActions"

interface RowPreview {
  row: ImportBalitaRow
  valid: boolean
  reason?: string
}

function mapRow(r: Record<string, string>, dusunDefault: string): RowPreview {
  const beratRaw = pickAlias(r, [...BALITA_FIELD_ALIASES.beratBadan])
  const tinggiRaw = pickAlias(r, [...BALITA_FIELD_ALIASES.tinggiBadan])
  const lilaRaw = pickAlias(r, [...BALITA_FIELD_ALIASES.lila])

  const row: ImportBalitaRow = {
    namaLengkap: pickAlias(r, [...BALITA_FIELD_ALIASES.namaLengkap]),
    nik: pickAlias(r, [...BALITA_FIELD_ALIASES.nik]),
    tanggalLahir: pickAlias(r, [...BALITA_FIELD_ALIASES.tanggalLahir]).trim(),
    jenisKelamin: pickAlias(r, [...BALITA_FIELD_ALIASES.jenisKelamin]).trim().toUpperCase(),
    namaOrangTua: pickAlias(r, [...BALITA_FIELD_ALIASES.namaOrangTua]),
    dusun: pickAlias(r, [...BALITA_FIELD_ALIASES.dusun]) || dusunDefault,
    alamat: pickAlias(r, [...BALITA_FIELD_ALIASES.alamat]),
    beratBadan: beratRaw ? String(parseIndonesianNumber(beratRaw)) : "",
    tinggiBadan: tinggiRaw ? String(parseIndonesianNumber(tinggiRaw)) : "",
    lila: lilaRaw ? String(parseIndonesianNumber(lilaRaw)) : "",
  }

  if (!row.namaLengkap.trim()) return { row, valid: false, reason: "Nama anak kosong" }
  if (!row.namaOrangTua.trim()) return { row, valid: false, reason: "Nama orang tua kosong" }
  if (row.jenisKelamin !== "L" && row.jenisKelamin !== "P") {
    return { row, valid: false, reason: `Jenis kelamin harus L/P (nilai asli: "${pickAlias(r, [...BALITA_FIELD_ALIASES.jenisKelamin])}")` }
  }
  if (isNaN(new Date(row.tanggalLahir).getTime())) {
    return { row, valid: false, reason: `Tanggal lahir tidak valid: "${row.tanggalLahir}"` }
  }
  if (beratRaw && isNaN(parseIndonesianNumber(beratRaw))) {
    return { row, valid: false, reason: `Berat badan tidak valid: "${beratRaw}"` }
  }
  if (tinggiRaw && isNaN(parseIndonesianNumber(tinggiRaw))) {
    return { row, valid: false, reason: `Tinggi badan tidak valid: "${tinggiRaw}"` }
  }
  return { row, valid: true }
}

export default function ImportBalitaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [tanggalPeriksa, setTanggalPeriksa] = useState(new Date().toISOString().split("T")[0])
  const [dusunDefault, setDusunDefault] = useState("")
  const [preview, setPreview] = useState<RowPreview[] | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function handleClose() {
    setPreview(null)
    setResult(null)
    setError(null)
    onClose()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    setError(null)
    setResult(null)
    try {
      const rows = await parseSpreadsheetFile(file, BALITA_KNOWN_TOKENS)
      if (rows.length === 0) {
        setError("Tidak ada baris data yang terbaca. Pastikan file punya kolom nama_anak/nama, tgl_lahir, jk, nm_ortu.")
        setPreview(null)
      } else {
        setPreview(rows.map((r) => mapRow(r, dusunDefault)))
      }
    } catch {
      setError("Gagal membaca file. Pastikan format .xlsx, .xls, atau .csv")
      setPreview(null)
    }
    setParsing(false)
  }

  async function handleImport() {
    if (!preview) return
    const validRows = preview.filter((p) => p.valid).map((p) => p.row)
    if (validRows.length === 0) return
    setImporting(true)
    setError(null)
    const res = await importBalitaBulk(validRows, tanggalPeriksa)
    setImporting(false)
    if ("error" in res) {
      setError(res.error ?? "Gagal mengimpor data")
    } else {
      setResult(res.result)
      router.refresh()
    }
  }

  const validCount = preview?.filter((p) => p.valid).length ?? 0
  const invalidCount = (preview?.length ?? 0) - validCount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Impor Data Balita (Excel/CSV)</h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          {!result && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                Mendukung file rekap posyandu asli (kolom <code>nama_anak, tgl_lahir, jk, nm_ortu, BERAT, TINGGI, LILA</code>,
                termasuk angka koma seperti &quot;10,9&quot;) maupun template baku.
                <button
                  onClick={() => downloadTemplate("template-balita.xlsx", BALITA_TEMPLATE_HEADERS, BALITA_TEMPLATE_SAMPLE_ROW)}
                  className="ml-2 inline-flex items-center gap-1 text-blue-700 font-semibold underline underline-offset-2"
                >
                  Unduh Template
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Tanggal Periksa <span className="text-gray-400 font-normal">(untuk baris dgn BB &amp; TB)</span>
                  </label>
                  <input type="date" value={tanggalPeriksa} onChange={(e) => setTanggalPeriksa(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Dusun <span className="text-gray-400 font-normal">(untuk semua baris)</span>
                  </label>
                  <input type="text" value={dusunDefault} onChange={(e) => setDusunDefault(e.target.value)}
                    placeholder="mis. Dasan Busur"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih File</label>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile}
                    className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-xs file:font-semibold hover:file:bg-blue-700" />
                </div>
              </div>

              {parsing && <p className="text-xs text-gray-500">Membaca file...</p>}

              {preview && (
                <>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-700 font-semibold">{validCount} baris valid</span>
                    {invalidCount > 0 && <span className="text-red-600 font-semibold">{invalidCount} baris bermasalah</span>}
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr>
                          {["#", "Nama", "Tgl Lahir", "JK", "BB", "TB", "Dusun", "Status"].map((h) => (
                            <th key={h} className="text-left py-2 px-3 font-semibold text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.map((p, i) => (
                          <tr key={i} className={p.valid ? "" : "bg-red-50"}>
                            <td className="py-1.5 px-3 font-mono text-gray-400">{i + 1}</td>
                            <td className="py-1.5 px-3 text-gray-800">{p.row.namaLengkap || "—"}</td>
                            <td className="py-1.5 px-3 text-gray-600">{p.row.tanggalLahir || "—"}</td>
                            <td className="py-1.5 px-3 text-gray-600">{p.row.jenisKelamin || "—"}</td>
                            <td className="py-1.5 px-3 text-gray-600">{p.row.beratBadan || "—"}</td>
                            <td className="py-1.5 px-3 text-gray-600">{p.row.tinggiBadan || "—"}</td>
                            <td className="py-1.5 px-3 text-gray-600">{p.row.dusun || "—"}</td>
                            <td className="py-1.5 px-3">
                              {p.valid
                                ? <span className="text-green-600 font-semibold">Valid</span>
                                : <span className="text-red-600 font-semibold">{p.reason}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {result && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                Berhasil impor <strong>{result.successCount}</strong> data balita.
              </div>
              {result.errorCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                  <p className="font-semibold mb-2">{result.errorCount} baris gagal:</p>
                  <ul className="space-y-1 text-xs max-h-40 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i}>Baris {e.row} ({e.nama}): {e.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              {result ? "Tutup" : "Batal"}
            </button>
            {!result && (
              <button onClick={handleImport} disabled={!preview || validCount === 0 || importing}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold transition">
                {importing ? "Mengimpor..." : `Impor ${validCount} Data Valid`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
