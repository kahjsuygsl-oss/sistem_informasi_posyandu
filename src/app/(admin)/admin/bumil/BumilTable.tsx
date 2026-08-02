"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import BumilFormModal from "@/components/bumil/BumilFormModal"
import ImportBumilModal from "@/components/import/ImportBumilModal"
import { deleteBumil } from "./actions"
import { downloadTemplate } from "@/lib/xlsxHelpers"
import { BUMIL_TEMPLATE_HEADERS, BUMIL_TEMPLATE_SAMPLE_ROW } from "@/lib/importSchemas"

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
  _count: { pemeriksaan: number }
}

export default function BumilTable({
  data,
  canManage = true,
  basePath = "/admin/bumil",
}: {
  data: Bumil[]
  canManage?: boolean
  basePath?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [filterTrimester, setFilterTrimester] = useState("all")
  const [filterDusun, setFilterDusun] = useState("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Bumil | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function trimester(usiaKehamilan: number | null) {
    if (usiaKehamilan === null) return null
    if (usiaKehamilan <= 12) return "1"
    if (usiaKehamilan <= 27) return "2"
    return "3"
  }

  const dusunList = Array.from(new Set(data.map((b) => b.dusun).filter((d): d is string => !!d))).sort()

  const filtered = data.filter((b) => {
    const q = search.toLowerCase()
    const matchSearch =
      b.namaLengkap.toLowerCase().includes(q) ||
      (b.namaSuami ?? "").toLowerCase().includes(q) ||
      (b.nik ?? "").includes(q) ||
      (b.alamat ?? "").toLowerCase().includes(q)
    const matchTrimester = filterTrimester === "all" || trimester(b.usiaKehamilan) === filterTrimester
    const matchDusun = filterDusun === "all" || b.dusun === filterDusun
    return matchSearch && matchTrimester && matchDusun
  })

  async function handleDelete(id: string) {
    setDeleting(true)
    await deleteBumil(id)
    setDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Cari nama, NIK, suami, atau alamat..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        {/* Filter Trimester (status kehamilan) */}
        <div className="flex gap-1.5">
          {[
            { val: "all", label: "Semua" },
            { val: "1", label: "Trimester 1" },
            { val: "2", label: "Trimester 2" },
            { val: "3", label: "Trimester 3" },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setFilterTrimester(val)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                filterTrimester === val
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filter Dusun */}
        <select
          value={filterDusun}
          onChange={(e) => setFilterDusun(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        >
          <option value="all">Semua Dusun</option>
          {dusunList.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Unduh Template */}
        <button
          onClick={() => downloadTemplate("template-bumil.xlsx", BUMIL_TEMPLATE_HEADERS, BUMIL_TEMPLATE_SAMPLE_ROW)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition"
          title="Unduh format Excel kosong yang sesuai untuk diisi lalu diimpor"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Unduh Template
        </button>

        {/* Impor */}
        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Impor Excel/CSV
        </button>

        <button
          onClick={() => { setEditTarget(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Bumil
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            Menampilkan <span className="font-semibold text-gray-900">{filtered.length}</span> dari{" "}
            <span className="font-semibold text-gray-900">{data.length}</span> ibu hamil
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["No", "Nama Ibu", "NIK", "Nama Suami", "Usia Kehamilan", "HPL", "Dusun", "Alamat", "Pemeriksaan", "Aksi"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-sm text-gray-400">
                    {search ? "Tidak ada hasil pencarian" : "Belum ada data ibu hamil"}
                  </td>
                </tr>
              ) : filtered.map((b, idx) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-xs font-mono text-gray-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{b.namaLengkap}</td>
                  <td className="py-3 px-4 text-xs font-mono text-gray-500">{b.nik ?? "—"}</td>
                  <td className="py-3 px-4 text-gray-600">{b.namaSuami ?? "—"}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">
                    {b.usiaKehamilan !== null ? `${b.usiaKehamilan} mgg` : "—"}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {b.hpl ? new Date(b.hpl).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{b.dusun ?? "—"}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{b.alamat ?? "—"}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {b._count.pemeriksaan}x
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <a href={`${basePath}/${b.id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition" title="Lihat detail">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      {canManage && (
                        <button onClick={() => { setEditTarget(b); setModalOpen(true) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => setDeleteId(b.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition" title="Hapus">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BumilFormModal open={modalOpen} onClose={() => { setModalOpen(false); router.refresh() }} bumil={editTarget} />

      {/* Modal Impor */}
      <ImportBumilModal open={importOpen} onClose={() => setImportOpen(false)} />

      {/* Konfirmasi Hapus */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Hapus Data Bumil?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">Data akan dinonaktifkan.</p>
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
    </>
  )
}
