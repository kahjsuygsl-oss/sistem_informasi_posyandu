"use client"

import { useMemo, useState } from "react"
import { labelGizi, labelStunting, labelBBU, GIZI_ORDER, STUNTING_ORDER } from "@/lib/zscore"

export interface LaporanRow {
  id: string
  tanggalPeriksa: Date
  umurBulan: number
  beratBadan: number
  tinggiBadan: number
  zScoreBBU: number | null
  zScoreTBU: number | null
  zScoreBBTB: number | null
  statusBBU: string | null
  statusStunting: string | null
  statusGizi: string | null
  balita: { namaLengkap: string; jenisKelamin: string }
  posyandu?: { nama: string } | null
}

function toInputDate(d: Date) {
  return d.toISOString().split("T")[0]
}

function defaultRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: toInputDate(start), end: toInputDate(end) }
}

export default function LaporanView({
  data,
  judul,
  subjudul,
  showPosyanduColumn = false,
}: {
  data: LaporanRow[]
  judul: string
  subjudul: string
  showPosyanduColumn?: boolean
}) {
  const initial = defaultRange()
  const [startDate, setStartDate] = useState(initial.start)
  const [endDate, setEndDate] = useState(initial.end)
  const [filterGizi, setFilterGizi] = useState("all")
  const [filterStunting, setFilterStunting] = useState("all")
  const [exporting, setExporting] = useState(false)

  const filtered = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    return data.filter((r) => {
      const t = new Date(r.tanggalPeriksa)
      const inRange = t >= start && t <= end
      const matchGizi = filterGizi === "all" || r.statusGizi === filterGizi
      const matchStunting = filterStunting === "all" || r.statusStunting === filterStunting
      return inRange && matchGizi && matchStunting
    })
  }, [data, startDate, endDate, filterGizi, filterStunting])

  const totalStunting = filtered.filter((r) => r.statusStunting && labelStunting(r.statusStunting).isStunting).length
  const totalGiziBuruk = filtered.filter((r) => r.statusGizi === "GIZI_BURUK").length

  async function handleExportPdf() {
    setExporting(true)
    try {
      const { default: jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default

      const doc = new jsPDF({ orientation: "landscape" })
      const periode = `${new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} - ${new Date(endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`

      doc.setFontSize(14)
      doc.text(judul, 14, 15)
      doc.setFontSize(10)
      doc.text(subjudul, 14, 21)
      doc.text(`Periode: ${periode}`, 14, 27)
      doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 14, 32)
      doc.text(`Total data: ${filtered.length} | Stunting: ${totalStunting} | Gizi Buruk: ${totalGiziBuruk}`, 14, 37)

      const head = [[
        "Tanggal", "Nama Balita", "JK", "Umur (bln)", "BB (kg)", "TB (cm)",
        ...(showPosyanduColumn ? ["Posyandu"] : []),
        "Z BB/U", "Status BB/U", "Z TB/U", "Status TB/U", "Z BB/TB", "Status Gizi",
      ]]
      const body = filtered.map((r) => [
        new Date(r.tanggalPeriksa).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
        r.balita.namaLengkap,
        r.balita.jenisKelamin,
        String(r.umurBulan),
        String(r.beratBadan),
        String(r.tinggiBadan),
        ...(showPosyanduColumn ? [r.posyandu?.nama ?? "—"] : []),
        r.zScoreBBU?.toFixed(2) ?? "—",
        r.statusBBU ? labelBBU(r.statusBBU).label : "—",
        r.zScoreTBU?.toFixed(2) ?? "—",
        r.statusStunting ? labelStunting(r.statusStunting).label : "—",
        r.zScoreBBTB?.toFixed(2) ?? "—",
        r.statusGizi ? labelGizi(r.statusGizi).label : "—",
      ])

      autoTable(doc, {
        head,
        body,
        startY: 42,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] },
      })

      const filename = `laporan-gizi-stunting_${startDate}_${endDate}.pdf`
      doc.save(filename)
    } finally {
      setExporting(false)
    }
  }

  const selectCls = "px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Dari Tanggal</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={selectCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={selectCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status Gizi (BB/TB)</label>
            <select value={filterGizi} onChange={(e) => setFilterGizi(e.target.value)} className={selectCls}>
              <option value="all">Semua</option>
              {GIZI_ORDER.map((s) => (
                <option key={s} value={s}>{labelGizi(s).label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status Stunting (TB/U)</label>
            <select value={filterStunting} onChange={(e) => setFilterStunting(e.target.value)} className={selectCls}>
              <option value="all">Semua</option>
              {STUNTING_ORDER.map((s) => (
                <option key={s} value={s}>{labelStunting(s).label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportPdf}
            disabled={exporting || filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold rounded-lg transition ml-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exporting ? "Menyiapkan..." : "Unduh PDF"}
          </button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Pemeriksaan</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{totalStunting}</p>
          <p className="text-xs text-gray-500 mt-1">Terindikasi Stunting</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{totalGiziBuruk}</p>
          <p className="text-xs text-gray-500 mt-1">Gizi Buruk</p>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span> data pada periode terpilih
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["Tanggal", "Nama Balita", "JK", "Umur", "BB", "TB",
                  ...(showPosyanduColumn ? ["Posyandu"] : []),
                  "Status BB/U", "Status TB/U", "Status Gizi"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={showPosyanduColumn ? 10 : 9} className="py-16 text-center text-sm text-gray-400">
                    Tidak ada data pada periode/filter ini
                  </td>
                </tr>
              ) : filtered.map((r) => {
                const gizi = r.statusGizi ? labelGizi(r.statusGizi) : null
                const stunting = r.statusStunting ? labelStunting(r.statusStunting) : null
                const bbu = r.statusBBU ? labelBBU(r.statusBBU) : null
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 text-xs text-gray-700 whitespace-nowrap">
                      {new Date(r.tanggalPeriksa).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">{r.balita.namaLengkap}</td>
                    <td className="py-3 px-3 text-xs text-gray-500">{r.balita.jenisKelamin}</td>
                    <td className="py-3 px-3 text-xs font-mono text-gray-600">{r.umurBulan} bln</td>
                    <td className="py-3 px-3 font-mono text-gray-800">{r.beratBadan}</td>
                    <td className="py-3 px-3 font-mono text-gray-800">{r.tinggiBadan}</td>
                    {showPosyanduColumn && (
                      <td className="py-3 px-3 text-xs text-gray-500">{r.posyandu?.nama ?? "—"}</td>
                    )}
                    <td className="py-3 px-3">
                      {bbu && <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${bbu.cls}`}>{bbu.label}</span>}
                    </td>
                    <td className="py-3 px-3">
                      {stunting && <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${stunting.cls}`}>{stunting.label}</span>}
                    </td>
                    <td className="py-3 px-3">
                      {gizi && <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${gizi.cls}`}>{gizi.label}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
