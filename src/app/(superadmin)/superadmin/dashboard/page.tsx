import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { GiziPieChart, StuntingBarChart } from "@/components/charts/DashboardCharts"
import Link from "next/link"
import { LogoutButton } from "@/components/auth/LogoutButton"
import { labelGizi, labelStunting, GIZI_ORDER, GIZI_CHART_COLOR, STUNTING_ORDER, STUNTING_CHART_COLOR } from "@/lib/zscore"

function StatCard({
  title,
  value,
  sub,
  icon,
  color,
}: {
  title: string
  value: number | string
  sub: string
  icon: React.ReactNode
  color: "blue" | "red" | "amber" | "green" | "purple" | "indigo"
}) {
  const colorMap = {
    blue:   { text: "text-blue-600",   iconBg: "bg-blue-100" },
    red:    { text: "text-red-600",    iconBg: "bg-red-100" },
    amber:  { text: "text-amber-600",  iconBg: "bg-amber-100" },
    green:  { text: "text-green-600",  iconBg: "bg-green-100" },
    purple: { text: "text-purple-600", iconBg: "bg-purple-100" },
    indigo: { text: "text-indigo-600", iconBg: "bg-indigo-100" },
  }
  const c = colorMap[color]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
      <div className={`${c.iconBg} ${c.text} p-3 rounded-xl flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
        <p className={`text-3xl font-bold leading-none mb-1 ${c.text}`}>{value}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  )
}

export default async function SuperadminDashboardPage() {
  const session = await auth()

  const [
    totalPosyandu,
    totalBalita,
    totalBumil,
    totalUser,
    totalKader,
    allPemeriksaan,
    posyanduList,
    pemeriksaanTerbaru,
  ] = await Promise.all([
    prisma.posyandu.count({ where: { isActive: true } }),
    prisma.balita.count({ where: { isAktif: true } }),
    prisma.bumil.count({ where: { isAktif: true } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "KADER", isActive: true } }),
    prisma.pemeriksaanBalita.findMany({
      orderBy: { tanggalPeriksa: "desc" },
      distinct: ["balitaId"],
      select: { statusGizi: true, statusStunting: true },
    }),
    // Statistik per posyandu
    prisma.posyandu.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { balita: true, bumil: true },
        },
      },
      orderBy: { nama: "asc" },
    }),
    // Pemeriksaan terbaru lintas posyandu
    prisma.pemeriksaanBalita.findMany({
      take: 8,
      orderBy: { tanggalPeriksa: "desc" },
      include: {
        balita: {
          select: {
            namaLengkap: true,
            jenisKelamin: true,
            posyandu: { select: { nama: true } },
          },
        },
      },
    }),
  ])

  // Hitung statistik dari pemeriksaan TERAKHIR tiap balita (bukan seluruh riwayat)
  const withZ = allPemeriksaan.filter(
    (p) => p.statusGizi !== null && p.statusStunting !== null
  )
  const totalStunting  = withZ.filter((p) => labelStunting(p.statusStunting!).isStunting).length
  const totalGiziBuruk = withZ.filter((p) => p.statusGizi === "GIZI_BURUK").length

  // Pie chart gizi (BB/TB — PRD §8.4)
  const giziPieData = GIZI_ORDER.map((status) => ({
    name: labelGizi(status).label,
    value: withZ.filter((p) => p.statusGizi === status).length,
    color: GIZI_CHART_COLOR[status],
  })).filter((d) => d.value > 0)

  // Bar chart stunting (TB/U — PRD §8.2)
  const stuntingBarData = STUNTING_ORDER.map((status) => ({
    status: labelStunting(status).label,
    jumlah: withZ.filter((p) => p.statusStunting === status).length,
    fill: STUNTING_CHART_COLOR[status],
  }))

  const tanggal = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Super Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Semua Posyandu · {tanggal}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {(session?.user?.name ?? "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 leading-tight">{session?.user?.name}</p>
                <p className="text-xs text-gray-500 leading-tight">Super Admin</p>
              </div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* Alert */}
      {(totalStunting > 0 || totalGiziBuruk > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">Perhatian: Kasus Prioritas Ditemukan</p>
            <p className="text-xs text-red-700 mt-0.5">
              {totalStunting > 0 && `${totalStunting} balita stunting di seluruh posyandu. `}
              {totalGiziBuruk > 0 && `${totalGiziBuruk} balita gizi buruk perlu penanganan segera.`}
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards — baris 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Posyandu"  value={totalPosyandu}  sub="Posyandu aktif"       color="indigo"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard title="Total Balita"    value={totalBalita}    sub="Seluruh posyandu"     color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard title="Total Bumil"     value={totalBumil}     sub="Ibu hamil aktif"      color="purple"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
        />
        <StatCard title="Terdeteksi Stunting" value={totalStunting}  sub="TB/U < −2 SD"     color="red"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <StatCard title="Gizi Buruk"      value={totalGiziBuruk} sub="BB/U < −3 SD"         color="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="Total Kader"     value={totalKader}     sub={`dari ${totalUser} user aktif`} color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
      </div>

      {/* Charts */}
      {withZ.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-0.5">Status Gizi (BB/U)</h2>
            <p className="text-xs text-gray-500 mb-4">Distribusi seluruh balita semua posyandu</p>
            <GiziPieChart data={giziPieData} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-0.5">Klasifikasi Tinggi Badan (TB/U)</h2>
            <p className="text-xs text-gray-500 mb-4">Deteksi stunting standar WHO — semua posyandu</p>
            <StuntingBarChart data={stuntingBarData} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">Belum ada data pemeriksaan</p>
          <p className="text-xs text-gray-400 mt-1">Chart akan muncul setelah ada data Z-Score</p>
        </div>
      )}

      {/* Tabel per posyandu */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Rekap Per Posyandu</h2>
          <Link href="/superadmin/posyandu" className="text-xs text-indigo-600 hover:underline font-medium">
            Lihat semua →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["Nama Posyandu", "Desa", "Kecamatan", "Balita", "Bumil"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posyanduList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-gray-400">
                    Belum ada posyandu terdaftar
                  </td>
                </tr>
              ) : (
                posyanduList.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{p.nama}</td>
                    <td className="py-3 px-4 text-gray-600">{p.desa}</td>
                    <td className="py-3 px-4 text-gray-600">{p.kecamatan}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                        {p._count.balita}
                        <span className="text-xs font-normal text-gray-400">anak</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-purple-700">
                        {p._count.bumil}
                        <span className="text-xs font-normal text-gray-400">ibu</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pemeriksaan terbaru lintas posyandu */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Pemeriksaan Terbaru — Semua Posyandu</h2>
        </div>
        {pemeriksaanTerbaru.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-400">Belum ada data pemeriksaan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Nama Balita", "Posyandu", "BB (kg)", "TB (cm)", "Status Gizi", "Stunting", "Tanggal"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pemeriksaanTerbaru.map((p) => {
                  const giziInfo = p.statusGizi ? labelGizi(p.statusGizi) : null
                  const stuntingInfo = p.statusStunting ? labelStunting(p.statusStunting) : null

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{p.balita.namaLengkap}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">{p.balita.posyandu?.nama ?? "—"}</td>
                      <td className="py-3 px-4 font-mono text-gray-700">{p.beratBadan}</td>
                      <td className="py-3 px-4 font-mono text-gray-700">{p.tinggiBadan}</td>
                      <td className="py-3 px-4">
                        {giziInfo ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${giziInfo.cls}`}>
                            {giziInfo.label}
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {stuntingInfo ? (
                          stuntingInfo.isStunting ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Stunting
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Normal
                            </span>
                          )
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {new Date(p.tanggalPeriksa).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
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
