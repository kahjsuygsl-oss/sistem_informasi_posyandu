"use client"

import { useEffect, useRef, useState } from "react"
import { createUser, updateUser } from "@/app/(superadmin)/superadmin/users/actions"

interface UserRow {
  id: string
  name: string
  email: string
  role: string
  posyanduId: string | null
}

interface Posyandu {
  id: string
  nama: string
}

interface Props {
  open: boolean
  onClose: () => void
  user?: UserRow | null
  canAssignRole: boolean       // hanya SUPERADMIN
  fixedRole?: string           // dipakai ADMIN — role selalu "KADER"
  posyanduList?: Posyandu[]    // hanya untuk SUPERADMIN (ADMIN sudah scoped ke posyandu sendiri)
}

export default function UserFormModal({ open, onClose, user, canAssignRole, fixedRole, posyanduList }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!user

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
    const result = isEdit ? await updateUser(user!.id, fd) : await createUser(fd)
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
            {isEdit ? "Edit Akun" : "Tambah Akun"}
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
            <input name="name" type="text" required defaultValue={user?.name ?? ""}
              placeholder="Nama pengguna" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Email *</label>
            <input name="email" type="email" required defaultValue={user?.email ?? ""}
              placeholder="nama@posyandu.id" className={inputCls} />
          </div>

          {!isEdit && (
            <div>
              <label className={labelCls}>Kata Sandi *</label>
              <input name="password" type="password" required minLength={6}
                placeholder="Minimal 6 karakter" className={inputCls} />
            </div>
          )}

          {canAssignRole ? (
            <div>
              <label className={labelCls}>Peran *</label>
              <select name="role" defaultValue={user?.role ?? "KADER"} className={inputCls}>
                <option value="KADER">Kader</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPERADMIN">Superadmin</option>
              </select>
            </div>
          ) : (
            <input type="hidden" name="role" value={fixedRole ?? "KADER"} />
          )}

          {canAssignRole && posyanduList && (
            <div>
              <label className={labelCls}>Posyandu <span className="text-gray-400 font-normal">(kosongkan jika Superadmin)</span></label>
              <select name="posyanduId" defaultValue={user?.posyanduId ?? ""} className={inputCls}>
                <option value="">— Tidak terikat posyandu —</option>
                {posyanduList.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold transition">
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
