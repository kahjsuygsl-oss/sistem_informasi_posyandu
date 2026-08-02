"use client"

import { useEffect, useRef, useState } from "react"
import { createBalita, updateBalita } from "@/app/(admin)/admin/balita/actions"

interface Balita {
  id: string
  namaLengkap: string
  nik: string | null
  tanggalLahir: Date
  jenisKelamin: string
  namaOrangTua: string
  dusun: string | null
  alamat: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  balita?: Balita | null // null = mode tambah, ada nilai = mode edit
}

export default function BalitaFormModal({ open, onClose, balita }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!balita

  // Reset form saat modal dibuka
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
    const result = isEdit
      ? await updateBalita(balita!.id, fd)
      : await createBalita(fd)

    setLoading(false)

    if (result?.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  const inputCls =
    "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1"

  // Format tanggal ke yyyy-MM-dd untuk input date
  const defaultTanggal = balita
    ? new Date(balita.tanggalLahir).toISOString().split("T")[0]
    : ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? "Edit Data Balita" : "Tambah Balita Baru"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Nama Lengkap */}
          <div>
            <label className={labelCls}>Nama Lengkap *</label>
            <input
              name="namaLengkap"
              type="text"
              required
              defaultValue={balita?.namaLengkap ?? ""}
              placeholder="Nama lengkap anak"
              className={inputCls}
            />
          </div>

          {/* NIK */}
          <div>
            <label className={labelCls}>NIK <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input
              name="nik"
              type="text"
              defaultValue={balita?.nik ?? ""}
              placeholder="16 digit NIK"
              maxLength={16}
              className={inputCls}
            />
          </div>

          {/* Tanggal Lahir + JK */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tanggal Lahir *</label>
              <input
                name="tanggalLahir"
                type="date"
                required
                defaultValue={defaultTanggal}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Jenis Kelamin *</label>
              <select
                name="jenisKelamin"
                required
                defaultValue={balita?.jenisKelamin ?? "L"}
                className={inputCls}
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          {/* Nama Orang Tua */}
          <div>
            <label className={labelCls}>Nama Orang Tua *</label>
            <input
              name="namaOrangTua"
              type="text"
              required
              defaultValue={balita?.namaOrangTua ?? ""}
              placeholder="Nama ayah / ibu"
              className={inputCls}
            />
          </div>

          {/* Dusun + Alamat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Dusun <span className="text-gray-400 font-normal">(opsional)</span></label>
              <input
                name="dusun"
                type="text"
                defaultValue={balita?.dusun ?? ""}
                placeholder="mis. Dasan Busur"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Alamat <span className="text-gray-400 font-normal">(opsional)</span></label>
              <input
                name="alamat"
                type="text"
                defaultValue={balita?.alamat ?? ""}
                placeholder="RT/RW"
                className={inputCls}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition"
            >
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Balita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
