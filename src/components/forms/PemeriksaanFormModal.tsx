"use client"

import { useState, useEffect } from "react"
import { createPemeriksaan } from "@/app/(admin)/admin/pemeriksaan/actions"
import { hitungZScore, labelGizi, labelStunting, labelBBU, rentangWajar } from "@/lib/zscore"

interface Balita {
  id: string
  namaLengkap: string
  jenisKelamin: string
  tanggalLahir: Date
}

function hitungUmurBulan(tglPeriksa: string, tanggalLahir: Date) {
  const periksa = new Date(tglPeriksa)
  const lahir = new Date(tanggalLahir)
  return (periksa.getFullYear() - lahir.getFullYear()) * 12 + (periksa.getMonth() - lahir.getMonth())
}

interface Props {
  open: boolean
  onClose: () => void
  balita: Balita | null
}

export default function PemeriksaanFormModal({ open, onClose, balita }: Props) {
  const [bb, setBb]       = useState("")
  const [tb, setTb]       = useState("")
  const [posisi, setPosisi] = useState("TERLENTANG")
  const [lk, setLk]       = useState("")
  const [lila, setLila]   = useState("")
  const [tgl, setTgl]     = useState(new Date().toISOString().split("T")[0])
  const [catatan, setCatatan] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [preview, setPreview] = useState<ReturnType<typeof hitungZScore> | null>(null)

  const umur = balita && tgl ? hitungUmurBulan(tgl, balita.tanggalLahir) : null
  const rentang = balita && umur !== null && umur >= 0 && umur <= 60
    ? rentangWajar(umur, balita.jenisKelamin as "L" | "P")
    : null

  // Hitung Z-Score preview real-time saat BB/TB berubah
  useEffect(() => {
    if (!balita || !bb || !tb || !tgl || umur === null) { setPreview(null); return }
    const beratNum  = parseFloat(bb)
    const tinggiNum = parseFloat(tb)
    if (isNaN(beratNum) || isNaN(tinggiNum) || beratNum <= 0 || tinggiNum <= 0) {
      setPreview(null); return
    }
    if (umur < 0 || umur > 60) { setPreview(null); return }
    setPreview(hitungZScore(beratNum, tinggiNum, umur, balita.jenisKelamin as "L" | "P", posisi as "BERDIRI" | "TERLENTANG"))
  }, [bb, tb, tgl, posisi, balita, umur])

  // FR-12: validasi rentang wajar BB/TB sesuai umur (±5 SD kurva WHO)
  const beratMin = rentang?.beratMin ?? null
  const beratMax = rentang?.beratMax ?? null
  const tinggiMin = rentang?.tinggiMin ?? null
  const tinggiMax = rentang?.tinggiMax ?? null

  const beratDiLuarRentang =
    beratMin !== null && beratMax !== null && bb
      ? parseFloat(bb) < beratMin || parseFloat(bb) > beratMax
      : false
  const tinggiDiLuarRentang =
    tinggiMin !== null && tinggiMax !== null && tb
      ? parseFloat(tb) < tinggiMin || parseFloat(tb) > tinggiMax
      : false

  // Reset saat buka modal
  useEffect(() => {
    if (open) {
      setBb(""); setTb(""); setLk(""); setLila("")
      setPosisi("TERLENTANG")
      setTgl(new Date().toISOString().split("T")[0])
      setCatatan(""); setError(null); setPreview(null)
    }
  }, [open])

  if (!open || !balita) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (beratDiLuarRentang || tinggiDiLuarRentang) {
      setError("Berat/tinggi badan di luar rentang wajar untuk umur balita ini. Periksa kembali input Anda.")
      return
    }
    setLoading(true); setError(null)
    const fd = new FormData(e.currentTarget)
    const result = await createPemeriksaan(fd)
    setLoading(false)
    if (result?.error) setError(result.error)
    else onClose()
  }

  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Input Pemeriksaan</h2>
            <p className="text-xs text-gray-500 mt-0.5">{balita.namaLengkap}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <input type="hidden" name="balitaId" value={balita.id} />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Tanggal */}
          <div>
            <label className={labelCls}>Tanggal Periksa *</label>
            <input name="tanggalPeriksa" type="date" required value={tgl}
              onChange={(e) => setTgl(e.target.value)} className={inputCls} />
          </div>

          {/* BB + TB */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Berat Badan (kg) *</label>
              <input name="beratBadan" type="number" step="0.1"
                min={beratMin ?? 1} max={beratMax ?? 30} required
                value={bb} onChange={(e) => setBb(e.target.value)}
                placeholder="mis. 8.5"
                className={`${inputCls} font-mono ${beratDiLuarRentang ? "border-red-400 focus:ring-red-500" : ""}`} />
              {beratMin !== null && beratMax !== null && (
                <p className={`text-xs mt-1 ${beratDiLuarRentang ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                  Rentang wajar: {beratMin}-{beratMax} kg
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>Tinggi Badan (cm) *</label>
              <input name="tinggiBadan" type="number" step="0.1"
                min={tinggiMin ?? 40} max={tinggiMax ?? 130} required
                value={tb} onChange={(e) => setTb(e.target.value)}
                placeholder="mis. 72.5"
                className={`${inputCls} font-mono ${tinggiDiLuarRentang ? "border-red-400 focus:ring-red-500" : ""}`} />
              {tinggiMin !== null && tinggiMax !== null && (
                <p className={`text-xs mt-1 ${tinggiDiLuarRentang ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                  Rentang wajar: {tinggiMin}-{tinggiMax} cm
                </p>
              )}
            </div>
          </div>

          {/* Posisi Ukur */}
          <div>
            <label className={labelCls}>Posisi Ukur *</label>
            <div className="flex gap-3">
              {[
                { value: "TERLENTANG", label: "Terlentang (< 2 tahun)" },
                { value: "BERDIRI", label: "Berdiri (≥ 2 tahun)" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input type="radio" name="posisiUkur" value={opt.value}
                    checked={posisi === opt.value}
                    onChange={(e) => setPosisi(e.target.value)} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* LK + LILA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Lingkar Kepala (cm)</label>
              <input name="lingkarKepala" type="number" step="0.1" min="20" max="60"
                value={lk} onChange={(e) => setLk(e.target.value)}
                placeholder="mis. 45.0" className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label className={labelCls}>LILA (cm)</label>
              <input name="lingkarLengan" type="number" step="0.1" min="5" max="30"
                value={lila} onChange={(e) => setLila(e.target.value)}
                placeholder="mis. 14.5" className={`${inputCls} font-mono`} />
            </div>
          </div>

          {/* Preview Z-Score real-time */}
          {preview ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">
                ✓ Hasil Z-Score WHO (otomatis)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "BB/U",  z: preview.zBBU,  info: labelBBU(preview.statusBBU ?? "") },
                  { key: "TB/U",  z: preview.zTBU,  info: labelStunting(preview.statusStunting ?? "") },
                  { key: "BB/TB", z: preview.zBBTB, info: labelGizi(preview.statusGizi ?? "") },
                ].map(({ key, z, info }) => (
                  <div key={key} className="bg-white rounded-lg p-3 text-center border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">{key}</p>
                    <p className="text-lg font-bold font-mono text-gray-900">
                      {z !== null ? z.toFixed(2) : "—"}
                    </p>
                    {z !== null && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${info.cls}`}>
                        {info.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {preview.statusStunting && (
                <div className={`mt-3 py-2 px-3 rounded-lg text-center text-xs font-bold ${
                  labelStunting(preview.statusStunting).isStunting
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {labelStunting(preview.statusStunting).isStunting ? "⚠ Terdeteksi Stunting" : "✓ Tidak Stunting"}
                </div>
              )}
            </div>
          ) : (bb || tb) ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-xs text-gray-400">Masukkan BB dan TB yang valid untuk melihat Z-Score</p>
            </div>
          ) : null}

          {/* Catatan */}
          <div>
            <label className={labelCls}>Catatan</label>
            <textarea name="catatan" rows={2} value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan tambahan (opsional)"
              className={`${inputCls} resize-none`} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Batal
            </button>
            <button type="submit" disabled={loading || beratDiLuarRentang || tinggiDiLuarRentang}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition">
              {loading ? "Menyimpan..." : "Simpan Pemeriksaan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
