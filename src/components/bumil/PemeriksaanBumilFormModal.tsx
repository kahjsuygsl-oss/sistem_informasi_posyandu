"use client"

import { useEffect, useState } from "react"
import { createPemeriksaanBumil } from "@/app/(admin)/admin/bumil/pemeriksaanActions"

interface Props {
  open: boolean
  onClose: () => void
  bumilId: string
  bumilNama: string
}

export default function PemeriksaanBumilFormModal({ open, onClose, bumilId, bumilNama }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const result = await createPemeriksaanBumil(fd)
    setLoading(false)
    if (result?.error) setError(result.error)
    else onClose()
  }

  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Input Pemeriksaan Kehamilan</h2>
            <p className="text-xs text-gray-500 mt-0.5">{bumilNama}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <input type="hidden" name="bumilId" value={bumilId} />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tanggal Periksa *</label>
              <input name="tanggalPeriksa" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Usia Kehamilan <span className="text-gray-400 font-normal">(minggu)</span></label>
              <input name="usiaKandungan" type="number" min="0" max="45" placeholder="mis. 20" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Berat Badan (kg)</label>
              <input name="beratBadan" type="number" step="0.1" min="30" max="150" placeholder="mis. 58.5" className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label className={labelCls}>Tinggi Badan (cm)</label>
              <input name="tinggiBadan" type="number" step="0.1" min="120" max="200" placeholder="mis. 155" className={`${inputCls} font-mono`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>LILA (cm) <span className="text-gray-400 font-normal">— KEK jika &lt; 23.5</span></label>
              <input name="lingkarLengan" type="number" step="0.1" min="10" max="40" placeholder="mis. 24.0" className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label className={labelCls}>Tekanan Darah</label>
              <input name="tekananDarah" type="text" placeholder="mis. 120/80" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Catatan</label>
            <textarea name="catatan" rows={2} placeholder="Catatan tambahan (opsional)" className={`${inputCls} resize-none`} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-semibold transition">
              {loading ? "Menyimpan..." : "Simpan Pemeriksaan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
