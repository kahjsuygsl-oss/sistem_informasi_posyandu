"use client"

import { useEffect, useRef, useState } from "react"
import { createBumil, updateBumil } from "@/app/(admin)/admin/bumil/actions"

interface Bumil {
  id: string
  namaLengkap: string
  nik: string | null
  namaSuami: string | null
  tanggalLahir: Date | null
  dusun: string | null
  alamat: string | null
  usiaKehamilan: number | null
  hpht: Date | null
  hpl: Date | null
}

interface Props {
  open: boolean
  onClose: () => void
  bumil?: Bumil | null
}

export default function BumilFormModal({ open, onClose, bumil }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hpht, setHpht] = useState(bumil?.hpht ? new Date(bumil.hpht).toISOString().split("T")[0] : "")
  const [hpl, setHpl] = useState(bumil?.hpl ? new Date(bumil.hpl).toISOString().split("T")[0] : "")
  const isEdit = !!bumil

  useEffect(() => {
    if (open) {
      setError(null)
      if (!isEdit) {
        formRef.current?.reset()
        setHpht("")
        setHpl("")
      } else {
        setHpht(bumil?.hpht ? new Date(bumil.hpht).toISOString().split("T")[0] : "")
        setHpl(bumil?.hpl ? new Date(bumil.hpl).toISOString().split("T")[0] : "")
      }
    }
  }, [open, isEdit, bumil])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const result = isEdit ? await updateBumil(bumil!.id, fd) : await createBumil(fd)
    setLoading(false)
    if (result?.error) setError(result.error)
    else onClose()
  }

  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1"
  const defaultTgl = bumil?.tanggalLahir
    ? new Date(bumil.tanggalLahir).toISOString().split("T")[0]
    : ""

  // Taksiran HPL otomatis dari HPHT (Rumus Naegele: HPHT + 280 hari)
  function handleHphtChange(value: string) {
    setHpht(value)
    if (value) {
      const d = new Date(value)
      d.setDate(d.getDate() + 280)
      setHpl(d.toISOString().split("T")[0])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? "Edit Data Bumil" : "Tambah Ibu Hamil"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition">
            ✕
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>Nama Lengkap *</label>
            <input name="namaLengkap" type="text" required defaultValue={bumil?.namaLengkap ?? ""}
              placeholder="Nama ibu" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>NIK <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input name="nik" type="text" defaultValue={bumil?.nik ?? ""}
              placeholder="16 digit NIK" maxLength={16} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Nama Suami <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input name="namaSuami" type="text" defaultValue={bumil?.namaSuami ?? ""}
              placeholder="Nama suami" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Tanggal Lahir <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input name="tanggalLahir" type="date" defaultValue={defaultTgl} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Usia Kehamilan <span className="text-gray-400 font-normal">(minggu)</span></label>
              <input name="usiaKehamilan" type="number" min="0" max="45" defaultValue={bumil?.usiaKehamilan ?? ""}
                placeholder="mis. 20" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>HPHT <span className="text-gray-400 font-normal">(opsional)</span></label>
              <input name="hpht" type="date" value={hpht}
                onChange={(e) => handleHphtChange(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              HPL <span className="text-gray-400 font-normal">(taksiran otomatis dari HPHT, bisa diubah)</span>
            </label>
            <input name="hpl" type="date" value={hpl}
              onChange={(e) => setHpl(e.target.value)} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Dusun <span className="text-gray-400 font-normal">(opsional)</span></label>
              <input name="dusun" type="text" defaultValue={bumil?.dusun ?? ""}
                placeholder="mis. Dasan Busur" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Alamat <span className="text-gray-400 font-normal">(opsional)</span></label>
              <input name="alamat" type="text" defaultValue={bumil?.alamat ?? ""}
                placeholder="RT/RW" className={inputCls} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-semibold transition">
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Bumil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
