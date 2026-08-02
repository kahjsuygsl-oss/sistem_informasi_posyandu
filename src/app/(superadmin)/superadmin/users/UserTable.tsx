"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import UserFormModal from "@/components/users/UserFormModal"
import ResetPasswordModal from "@/components/users/ResetPasswordModal"
import { toggleActiveUser } from "./actions"

interface UserRow {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  posyanduId: string | null
  posyandu: { nama: string } | null
}

interface Posyandu {
  id: string
  nama: string
}

const ROLE_LABEL: Record<string, { label: string; cls: string }> = {
  SUPERADMIN: { label: "Superadmin", cls: "bg-indigo-100 text-indigo-700" },
  ADMIN:      { label: "Admin",      cls: "bg-blue-100 text-blue-700" },
  KADER:      { label: "Kader",      cls: "bg-green-100 text-green-700" },
}

export default function UserTable({
  data,
  canAssignRole,
  fixedRole = "KADER",
  posyanduList,
  currentUserId,
}: {
  data: UserRow[]
  canAssignRole: boolean
  fixedRole?: string
  posyanduList?: Posyandu[]
  currentUserId: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserRow | null>(null)
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const filtered = data.filter((u) => {
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  async function handleToggleActive(id: string) {
    setTogglingId(id)
    const result = await toggleActiveUser(id)
    setTogglingId(null)
    if (!result?.error) router.refresh()
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Cari nama atau email..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <button
          onClick={() => { setEditTarget(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Akun
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            Menampilkan <span className="font-semibold text-gray-900">{filtered.length}</span> dari{" "}
            <span className="font-semibold text-gray-900">{data.length}</span> akun
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["No", "Nama", "Email", "Peran", "Posyandu", "Status", "Aksi"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    {search ? "Tidak ada hasil pencarian" : "Belum ada akun"}
                  </td>
                </tr>
              ) : filtered.map((u, idx) => {
                const roleInfo = ROLE_LABEL[u.role] ?? { label: u.role, cls: "bg-gray-100 text-gray-700" }
                const isSelf = u.id === currentUserId
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {u.name} {isSelf && <span className="text-xs text-gray-400 font-normal">(Anda)</span>}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${roleInfo.cls}`}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{u.posyandu?.nama ?? "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${u.isActive ? "text-green-600" : "text-gray-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditTarget(u); setModalOpen(true) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => setResetTarget(u)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition" title="Reset kata sandi">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </button>
                        {!isSelf && (
                          <button onClick={() => handleToggleActive(u.id)} disabled={togglingId === u.id}
                            className={`p-1.5 rounded-lg transition ${u.isActive ? "text-gray-400 hover:bg-red-50 hover:text-red-600" : "text-gray-400 hover:bg-green-50 hover:text-green-600"}`}
                            title={u.isActive ? "Nonaktifkan" : "Aktifkan"}>
                            {u.isActive ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <UserFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); router.refresh() }}
        user={editTarget}
        canAssignRole={canAssignRole}
        fixedRole={fixedRole}
        posyanduList={posyanduList}
      />

      {resetTarget && (
        <ResetPasswordModal
          userId={resetTarget.id}
          userName={resetTarget.name}
          onClose={() => { setResetTarget(null); router.refresh() }}
        />
      )}
    </>
  )
}
