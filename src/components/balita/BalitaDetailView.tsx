import Link from "next/link"
import { labelGizi, labelStunting, labelBBU } from "@/lib/zscore"
import GrowthTrendSection from "./GrowthTrendSection"

function umurBulan(tgl: Date) {
  const now = new Date()
  const lahir = new Date(tgl)
  return (now.getFullYear() - lahir.getFullYear()) * 12 + (now.getMonth() - lahir.getMonth())
}

interface Pemeriksaan {
  id: string
  tanggalPeriksa: Date
  umurBulan: number
  beratBadan: number
  tinggiBadan: number
  lingkarKepala: number | null
  lingkarLengan: number | null
  zScoreBBU: number | null
  zScoreTBU: number | null
  zScoreBBTB: number | null
  statusBBU: string | null
  statusStunting: string | null
  statusGizi: string | null
  kader: { name: string }
}

interface Balita {
  id: string
  namaLengkap: string
  nik: string | null
  tanggalLahir: Date
  jenisKelamin: string
  namaOrangTua: string
  dusun: string | null
  alamat: string | null
  posyandu: { nama: string }
  pemeriksaan: Pemeriksaan[]
}

export default function BalitaDetailView({
  balita,
  backHref,
}: {
  balita: Balita
  backHref: string
}) {
  const usia = umurBulan(balita.tanggalLahir)
  const pemeriksaanTerakhir = balita.pemeriksaan[0] ?? null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={backHref} className="hover:text-blue-600 transition">
          Data Balita
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{balita.namaLengkap}</span>
      </div>

      {/* Profil Balita */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
            balita.jenisKelamin === "L" ? "bg-blue-100" : "bg-pink-100"
          }`}>
            {balita.jenisKelamin === "L" ? "👦" : "👧"}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{balita.namaLengkap}</h1>
                {balita.nik && (
                  <p className="text-xs font-mono text-gray-400 mt-0.5">NIK: {balita.nik}</p>
                )}
              </div>
              {pemeriksaanTerakhir?.statusStunting && (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  labelStunting(pemeriksaanTerakhir.statusStunting).isStunting
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {labelStunting(pemeriksaanTerakhir.statusStunting).isStunting ? "⚠ Stunting" : "✓ Normal"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[
                ["Jenis Kelamin", balita.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"],
                ["Tanggal Lahir", new Date(balita.tanggalLahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })],
                ["Umur", usia < 12 ? `${usia} bulan` : `${Math.floor(usia / 12)} thn ${usia % 12} bln`],
                ["Posyandu", balita.posyandu.nama],
                ["Orang Tua", balita.namaOrangTua],
                ["Dusun", balita.dusun ?? "—"],
                ["Alamat", balita.alamat ?? "—"],
                ["Total Pemeriksaan", `${balita.pemeriksaan.length}x`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-500">{k}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hasil Terakhir Z-Score */}
      {pemeriksaanTerakhir && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Hasil Pemeriksaan Terakhir</h2>
            <span className="text-xs text-gray-500">
              {new Date(pemeriksaanTerakhir.tanggalPeriksa).toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              ["Berat Badan", `${pemeriksaanTerakhir.beratBadan} kg`],
              ["Tinggi Badan", `${pemeriksaanTerakhir.tinggiBadan} cm`],
              ["Lingkar Kepala", pemeriksaanTerakhir.lingkarKepala ? `${pemeriksaanTerakhir.lingkarKepala} cm` : "—"],
              ["LILA", pemeriksaanTerakhir.lingkarLengan ? `${pemeriksaanTerakhir.lingkarLengan} cm` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{k}</p>
                <p className="text-lg font-bold text-gray-900">{v}</p>
              </div>
            ))}
          </div>

          {/* Z-Score */}
          {(pemeriksaanTerakhir.zScoreBBU !== null ||
            pemeriksaanTerakhir.zScoreTBU !== null ||
            pemeriksaanTerakhir.zScoreBBTB !== null) && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hasil Z-Score WHO</p>
              <div className="grid grid-cols-3 gap-3">
                {pemeriksaanTerakhir.zScoreBBU !== null && pemeriksaanTerakhir.statusBBU && (() => {
                  const g = labelBBU(pemeriksaanTerakhir.statusBBU)
                  return (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">BB/U</p>
                      <p className="text-xl font-bold font-mono text-gray-900">
                        {pemeriksaanTerakhir.zScoreBBU.toFixed(2)}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${g.cls}`}>
                        {g.label}
                      </span>
                    </div>
                  )
                })()}
                {pemeriksaanTerakhir.zScoreTBU !== null && pemeriksaanTerakhir.statusStunting && (() => {
                  const s = labelStunting(pemeriksaanTerakhir.statusStunting)
                  return (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">TB/U (Stunting)</p>
                      <p className="text-xl font-bold font-mono text-gray-900">
                        {pemeriksaanTerakhir.zScoreTBU.toFixed(2)}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>
                  )
                })()}
                {pemeriksaanTerakhir.zScoreBBTB !== null && pemeriksaanTerakhir.statusGizi && (() => {
                  const w = labelGizi(pemeriksaanTerakhir.statusGizi)
                  return (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">BB/TB (Status Gizi)</p>
                      <p className="text-xl font-bold font-mono text-gray-900">
                        {pemeriksaanTerakhir.zScoreBBTB.toFixed(2)}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${w.cls}`}>
                        {w.label}
                      </span>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grafik Tren Pertumbuhan (FR-19) */}
      <GrowthTrendSection pemeriksaan={balita.pemeriksaan} />

      {/* Riwayat Pemeriksaan */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Riwayat Pemeriksaan</h2>
          <span className="text-xs text-gray-500">{balita.pemeriksaan.length} pemeriksaan</span>
        </div>

        {balita.pemeriksaan.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-400">Belum ada riwayat pemeriksaan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Tanggal", "Umur", "BB (kg)", "TB (cm)", "LILA", "Z BB/U", "Z TB/U", "Z BB/TB", "Status", "Kader"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {balita.pemeriksaan.map((p, idx) => {
                  const isLatest = idx === 0
                  const gizi = p.statusBBU ? labelBBU(p.statusBBU) : null
                  const tbu  = p.statusStunting ? labelStunting(p.statusStunting) : null
                  const bbtb = p.statusGizi ? labelGizi(p.statusGizi) : null

                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isLatest ? "bg-blue-50/40" : ""}`}>
                      <td className="py-3 px-4 text-xs text-gray-700 font-medium whitespace-nowrap">
                        {new Date(p.tanggalPeriksa).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        {isLatest && <span className="ml-1.5 text-xs text-blue-600 font-semibold">Terbaru</span>}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-gray-600">{p.umurBulan} bln</td>
                      <td className="py-3 px-4 font-mono text-gray-800">{p.beratBadan}</td>
                      <td className="py-3 px-4 font-mono text-gray-800">{p.tinggiBadan}</td>
                      <td className="py-3 px-4 font-mono text-gray-600 text-xs">{p.lingkarLengan ?? "—"}</td>
                      <td className="py-3 px-4">
                        {p.zScoreBBU !== null ? (
                          <div>
                            <span className="font-mono text-xs text-gray-600">{p.zScoreBBU.toFixed(2)}</span>
                            {gizi && <span className={`block text-xs font-semibold mt-0.5 ${gizi.cls.split(" ")[1]}`}>{gizi.label}</span>}
                          </div>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {p.zScoreTBU !== null ? (
                          <div>
                            <span className="font-mono text-xs text-gray-600">{p.zScoreTBU.toFixed(2)}</span>
                            {tbu && <span className={`block text-xs font-semibold mt-0.5 ${tbu.cls.split(" ")[1]}`}>{tbu.label}</span>}
                          </div>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {p.zScoreBBTB !== null ? (
                          <div>
                            <span className="font-mono text-xs text-gray-600">{p.zScoreBBTB.toFixed(2)}</span>
                            {bbtb && <span className={`block text-xs font-semibold mt-0.5 ${bbtb.cls.split(" ")[1]}`}>{bbtb.label}</span>}
                          </div>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {tbu ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tbu.isStunting ? "text-red-600" : "text-green-600"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tbu.isStunting ? "bg-red-500" : "bg-green-500"}`} />
                            {tbu.isStunting ? "Stunting" : "Normal"}
                          </span>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{p.kader.name}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
