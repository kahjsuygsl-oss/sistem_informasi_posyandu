import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { GiziPieChart, StuntingBarChart } from "@/components/charts/DashboardCharts"
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
  color: string
}) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100" },
    red: { bg: "bg-red-50", text: "text-red-600", iconBg: "bg-red-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", iconBg: "bg-amber-100" },
    green: { bg: "bg-green-50", text: "text-green-600", iconBg: "bg-green-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", iconBg: "bg-purple-100" },
  }
  const c = colorMap[color] ?? colorMap.blue

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
      <div className={`${c.iconBg} ${c.text} p-3 rounded-xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {title}
        </p>
        <p className={`text-3xl font-bold leading-none mb-1 ${c.text}`}>{value}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const session = await auth()

  // Ambil data dari DB berdasarkan posyandu admin
  const posyanduId = session?.user?.posyanduId

  const [
    totalBalita,
    totalBumil,
    pemeriksaanTerbaru,
    allPemeriksaan,
    posyandu,
  ] = await Promise.all([
    prisma.balita.count({
      where: { isAktif: true, ...(posyanduId ? { posyanduId } : {}) },
    }),
    prisma.bumil.count({
      where: { isAktif: true, ...(posyanduId ? { posyanduId } : {}) },
    }),
    prisma.pemeriksaanBalita.findMany({
      take: 8,
      orderBy: { tanggalPeriksa: "desc" },
      include: {
        balita: { select: { namaLengkap: true, jenisKelamin: true, posyanduId: true } },
      },
      where: posyanduId
        ? { balita: { posyanduId } }
        : {},
    }),
    prisma.pemeriksaanBalita.findMany({
      where: posyanduId ? { balita: { posyanduId } } : {},
      orderBy: { tanggalPeriksa: "desc" },
      distinct: ["balitaId"],
      select: { statusGizi: true, statusStunting: true },
    }),
    posyanduId
      ? prisma.posyandu.findUnique({ where: { id: posyanduId } })
      : null,
  ])

  // Hitung statistik dari pemeriksaan TERAKHIR tiap balita (bukan seluruh riwayat)
  const pemeriksaanDenganZ = allPemeriksaan.filter(
    (p) => p.statusGizi !== null && p.statusStunting !== null
  )

  const stunting = pemeriksaanDenganZ.filter(
    (p) => labelStunting(p.statusStunting!).isStunting
  ).length

  const giziBuruk = pemeriksaanDenganZ.filter(
    (p) => p.statusGizi === "GIZI_BURUK"
  ).length

  // Data untuk pie chart gizi (BB/TB — PRD §8.4)
  const giziPieData = GIZI_ORDER.map((status) => ({
    name: labelGizi(status).label,
    value: pemeriksaanDenganZ.filter((p) => p.statusGizi === status).length,
    color: GIZI_CHART_COLOR[status],
  })).filter((d) => d.value > 0)

  // Data untuk bar chart stunting (TB/U — PRD §8.2)
  const stuntingBarData = STUNTING_ORDER.map((status) => ({
    status: labelStunting(status).label,
    jumlah: pemeriksaanDenganZ.filter((p) => p.statusStunting === status).length,
    fill: STUNTING_CHART_COLOR[status],
  }))

  const now = new Date()
  const tanggal = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {posyandu?.nama ?? "Semua Posyandu"} · {tanggal}
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Alert jika ada kasus prioritas */}
      {(stunting > 0 || giziBuruk > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">Perhatian: Ditemukan Kasus Prioritas</p>
            <p className="text-xs text-red-700 mt-0.5">
              {stunting > 0 && `${stunting} balita terdeteksi stunting (TB/U < -2 SD). `}
              {giziBuruk > 0 && `${giziBuruk} balita dengan gizi buruk memerlukan penanganan segera.`}
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balita"
          value={totalBalita}
          sub="Terdaftar aktif"
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Stunting"
          value={stunting}
          sub="TB/U < −2 SD"
          color="red"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          title="Gizi Buruk"
          value={giziBuruk}
          sub="BB/U < −3 SD"
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Ibu Hamil"
          value={totalBumil}
          sub="Terdaftar aktif"
          color="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      {pemeriksaanDenganZ.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pie Chart Gizi */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-0.5">
              Status Gizi (BB/TB)
            </h2>
            <p className="text-xs text-gray-500 mb-4">Distribusi keseluruhan balita</p>
            <GiziPieChart data={giziPieData} />
          </div>

          {/* Bar Chart Stunting */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-0.5">
              Klasifikasi Tinggi Badan (TB/U)
            </h2>
            <p className="text-xs text-gray-500 mb-4">Deteksi stunting berdasarkan standar WHO</p>
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

      {/* Tabel pemeriksaan terbaru */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Pemeriksaan Terbaru</h2>
        </div>

        {pemeriksaanTerbaru.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">Belum ada data pemeriksaan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Nama Balita", "JK", "BB (kg)", "TB (cm)", "Status Gizi", "Stunting", "Tanggal"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pemeriksaanTerbaru.map((p) => {
                  const giziInfo = p.statusGizi ? labelGizi(p.statusGizi) : null
                  const stuntingInfo = p.statusStunting ? labelStunting(p.statusStunting) : null

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {p.balita.namaLengkap}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {p.balita.jenisKelamin === "L" ? "L" : "P"}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700">{p.beratBadan}</td>
                      <td className="py-3 px-4 font-mono text-gray-700">{p.tinggiBadan}</td>
                      <td className="py-3 px-4">
                        {giziInfo ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${giziInfo.cls}`}>
                            {giziInfo.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {stuntingInfo !== null ? (
                          stuntingInfo.isStunting ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Stunting
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Normal
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {new Date(p.tanggalPeriksa).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
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
