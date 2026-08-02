"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PemeriksaanBumilFormModal from "./PemeriksaanBumilFormModal"
import { deletePemeriksaanBumil } from "@/app/(admin)/admin/bumil/pemeriksaanActions"

interface PemeriksaanBumil {
  id: string
  tanggalPeriksa: Date
  usiaKandungan: number | null
  beratBadan: number | null
  tinggiBadan: number | null
  lingkarLengan: number | null
  imt: number | null
  tekananDarah: string | null
  statusKek: boolean
  catatan: string | null
}

export default function PemeriksaanKehamilanSection({
  bumilId,
  bumilNama,
  data,
  canDelete = true,
}: {
  bumilId: string
  bumilNama: string
  data: PemeriksaanBumil[]
  canDelete?: boolean
}) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(id: string) {
    setDeleting(true)
    await deletePemeriksaanBumil(id, bumilId)
    setDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Riwayat Pemeriksaan Kehamilan</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Input Pemeriksaan
        </button>
      </div>

      {data.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm text-gray-400">Belum ada riwayat pemeriksaan</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["Tanggal", "Usia Kandungan", "BB", "TB", "LILA", "IMT", "Tekanan Darah", "KEK", "Catatan", ...(canDelete ? ["Aksi"] : [])].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3 text-xs text-gray-700 whitespace-nowrap">
                    {new Date(p.tanggalPeriksa).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3 px-3 text-xs font-mono text-gray-600">{p.usiaKandungan !== null ? `${p.usiaKandungan} mgg` : "—"}</td>
                  <td className="py-3 px-3 font-mono text-gray-800">{p.beratBadan ?? "—"}</td>
                  <td className="py-3 px-3 font-mono text-gray-800">{p.tinggiBadan ?? "—"}</td>
                  <td className="py-3 px-3 font-mono text-gray-800">{p.lingkarLengan ?? "—"}</td>
                  <td className="py-3 px-3 font-mono text-xs text-gray-600">{p.imt ?? "—"}</td>
                  <td className="py-3 px-3 text-xs text-gray-600">{p.tekananDarah ?? "—"}</td>
                  <td className="py-3 px-3">
                    {p.statusKek ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> KEK
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-500 max-w-[160px] truncate">{p.catatan ?? "—"}</td>
                  {canDelete && (
                    <td className="py-3 px-3">
                      <button onClick={() => setDeleteId(p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PemeriksaanBumilFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); router.refresh() }}
        bumilId={bumilId}
        bumilNama={bumilNama}
      />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 text-center mb-2">Hapus Data Pemeriksaan?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">Data akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-semibold transition">
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
