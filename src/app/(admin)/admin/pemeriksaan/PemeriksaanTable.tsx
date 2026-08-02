"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PemeriksaanFormModal from "@/components/forms/PemeriksaanFormModal"
import { deletePemeriksaan } from "./actions"
import { labelGizi, labelStunting, labelBBU } from "@/lib/zscore"

interface Balita {
  id: string
  namaLengkap: string
  jenisKelamin: string
  tanggalLahir: Date
}

interface Pemeriksaan {
  id: string
  tanggalPeriksa: Date
  umurBulan: number
  beratBadan: number
  tinggiBadan: number
  lingkarLengan: number | null
  zScoreBBU: number | null
  zScoreTBU: number | null
  zScoreBBTB: number | null
  statusBBU: string | null
  statusGizi: string | null
  statusStunting: string | null
  balita: { namaLengkap: string; jenisKelamin: string }
  kader: { name: string }
}

interface Props {
  pemeriksaanList: Pemeriksaan[]
  balitaList: Balita[]
}

export default function PemeriksaanTable({ pemeriksaanList, balitaList, canDelete = true }: Props & { canDelete?: boolean }) {
  const router = useRouter()
  const [modalOpen, setModalOpen]       = useState(false)
  const [selectedBalita, setSelectedBalita] = useState<Balita | null>(null)
  const [search, setSearch]             = useState("")
  const [deleteId, setDeleteId]         = useState<string | null>(null)
  const [deleting, setDeleting]         = useState(false)

  const filtered = pemeriksaanList.filter((p) => {
    const q = search.toLowerCase()
    return p.balita.namaLengkap.toLowerCase().includes(q)
  })

  async function handleDelete(id: string) {
    setDeleting(true)
    await deletePemeriksaan(id)
    setDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  function openModal(balita: Balita) {
    setSelectedBalita(balita)
    setModalOpen(true)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Cari nama balita..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Dropdown pilih balita untuk input baru */}
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            defaultValue=""
            onChange={(e) => {
              const b = balitaList.find((x) => x.id === e.target.value)
              if (b) openModal(b)
              e.target.value = ""
            }}
          >
            <option value="" disabled>Pilih balita...</option>
            {balitaList.map((b) => (
              <option key={b.id} value={b.id}>{b.namaLengkap}</option>
            ))}
          </select>
          <button
            onClick={() => selectedBalita && setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Input Pemeriksaan
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span> data pemeriksaan
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["Tanggal","Nama Balita","Umur","BB","TB","LILA","Z BB/U","Z TB/U","Z BB/TB","Status","Kader","Aksi"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-sm text-gray-400">
                    {search ? "Tidak ada hasil" : "Belum ada data pemeriksaan"}
                  </td>
                </tr>
              ) : filtered.map((p) => {
                const giziInfo     = p.statusGizi     ? labelGizi(p.statusGizi)         : null
                const stuntingInfo = p.statusStunting ? labelStunting(p.statusStunting) : null
                const bbuInfo      = p.statusBBU      ? labelBBU(p.statusBBU)           : null

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 text-xs text-gray-700 whitespace-nowrap">
                      {new Date(p.tanggalPeriksa).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">{p.balita.namaLengkap}</td>
                    <td className="py-3 px-3 font-mono text-xs text-gray-600">{p.umurBulan} bln</td>
                    <td className="py-3 px-3 font-mono text-gray-800">{p.beratBadan}</td>
                    <td className="py-3 px-3 font-mono text-gray-800">{p.tinggiBadan}</td>
                    <td className="py-3 px-3 font-mono text-xs text-gray-600">{p.lingkarLengan ?? "—"}</td>
                    <td className="py-3 px-3 font-mono text-xs text-gray-600">{p.zScoreBBU?.toFixed(2) ?? "—"}</td>
                    <td className="py-3 px-3 font-mono text-xs text-gray-600">{p.zScoreTBU?.toFixed(2) ?? "—"}</td>
                    <td className="py-3 px-3 font-mono text-xs text-gray-600">{p.zScoreBBTB?.toFixed(2) ?? "—"}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {giziInfo && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${giziInfo.cls}`}>
                            {giziInfo.label}
                          </span>
                        )}
                        {bbuInfo && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${bbuInfo.cls}`}>
                            {bbuInfo.label}
                          </span>
                        )}
                        {stuntingInfo && stuntingInfo.isStunting && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Stunting
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">{p.kader.name}</td>
                    <td className="py-3 px-3">
                      {canDelete && (
                        <button onClick={() => setDeleteId(p.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PemeriksaanFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); router.refresh() }}
        balita={selectedBalita}
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
    </>
  )
}
