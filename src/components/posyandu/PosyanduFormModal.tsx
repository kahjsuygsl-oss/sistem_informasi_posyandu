"use client"

import { useEffect, useRef, useState } from "react"
import { createPosyandu, updatePosyandu } from "@/app/(superadmin)/superadmin/posyandu/actions"

interface Posyandu {
  id: string
  nama: string
  desa: string
  kecamatan: string
  kabupaten: string
  provinsi: string
}

interface Props {
  open: boolean
  onClose: () => void
  posyandu?: Posyandu | null
}

export default function PosyanduFormModal({ open, onClose, posyandu }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!posyandu

  useEffect(() => {
    if (open) {
      setError(null)
      if (!isEdit) formRef.current?.reset()
    }
  }, [open, isEdit])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const result = isEdit ? await updatePosyandu(posyandu!.id, fd) : await createPosyandu(fd)
    setLoading(false)
    if (result?.error) setError(result.error)
    else onClose()
  }

  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? "Edit Posyandu" : "Tambah Posyandu"}
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
            <label className={labelCls}>Nama Posyandu *</label>
            <input name="nama" type="text" required defaultValue={posyandu?.nama ?? ""}
              placeholder="mis. Embung Sempait" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Desa *</label>
            <input name="desa" type="text" required defaultValue={posyandu?.desa ?? ""}
              placeholder="mis. Rumbuk Timur" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kecamatan *</label>
              <input name="kecamatan" type="text" required defaultValue={posyandu?.kecamatan ?? ""}
                placeholder="mis. Sakra" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Kabupaten *</label>
              <input name="kabupaten" type="text" required defaultValue={posyandu?.kabupaten ?? ""}
                placeholder="mis. Lombok Timur" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Provinsi</label>
            <input name="provinsi" type="text" defaultValue={posyandu?.provinsi ?? "NUSA TENGGARA BARAT"}
              className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold transition">
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Posyandu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
