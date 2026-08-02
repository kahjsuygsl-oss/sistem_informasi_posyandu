"use client"

import { useMemo, useState } from "react"
import { GrowthTrendChart } from "@/components/charts/DashboardCharts"

interface Pemeriksaan {
  tanggalPeriksa: Date
  zScoreBBU: number | null
  zScoreTBU: number | null
}

const RANGES = [
  { val: "7d", label: "7 Hari", days: 7 },
  { val: "1m", label: "1 Bulan", days: 30 },
  { val: "3m", label: "3 Bulan", days: 90 },
  { val: "6m", label: "6 Bulan", days: 180 },
  { val: "1y", label: "1 Tahun", days: 365 },
  { val: "all", label: "Semua Waktu", days: null as number | null },
]

export default function GrowthTrendSection({ pemeriksaan }: { pemeriksaan: Pemeriksaan[] }) {
  const [range, setRange] = useState("all")

  const trendData = useMemo(() => {
    const activeRange = RANGES.find((r) => r.val === range)
    const now = new Date()
    const cutoff = activeRange?.days ? new Date(now.getTime() - activeRange.days * 24 * 60 * 60 * 1000) : null

    return [...pemeriksaan]
      .filter((p) => !cutoff || new Date(p.tanggalPeriksa) >= cutoff)
      .sort((a, b) => new Date(a.tanggalPeriksa).getTime() - new Date(b.tanggalPeriksa).getTime())
      .map((p) => ({
        tanggal: new Date(p.tanggalPeriksa).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "2-digit" }),
        zBBU: p.zScoreBBU,
        zTBU: p.zScoreTBU,
      }))
  }, [pemeriksaan, range])

  if (pemeriksaan.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-0.5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Grafik Tren Pertumbuhan</h2>
          <p className="text-xs text-gray-500">Perkembangan Z-Score BB/U dan TB/U dari waktu ke waktu</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r.val}
              onClick={() => setRange(r.val)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                range === r.val
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {trendData.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            Tidak ada data pemeriksaan pada rentang waktu ini
          </p>
        ) : trendData.length === 1 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            Hanya ada 1 data pemeriksaan pada rentang ini — perlu minimal 2 untuk menampilkan grafik tren
          </p>
        ) : (
          <GrowthTrendChart data={trendData} />
        )}
      </div>
    </div>
  )
}
