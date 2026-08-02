import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { StuntingBarChart } from "@/components/charts/DashboardCharts"
import Link from "next/link"
import { LogoutButton } from "@/components/auth/LogoutButton"
import { labelGizi, labelStunting, STUNTING_ORDER, STUNTING_CHART_COLOR } from "@/lib/zscore"

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
  const colorMap: Record<string, { bg: string; text: string; iconBg: string; border: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100", border: "border-blue-200" },
    red: { bg: "bg-red-50", text: "text-red-600", iconBg: "bg-red-100", border: "border-red-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", iconBg: "bg-amber-100", border: "border-amber-200" },
    green: { bg: "bg-green-50", text: "text-green-600", iconBg: "bg-green-100", border: "border-green-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", iconBg: "bg-purple-100", border: "border-purple-200" },
  }
  const c = colorMap[color] ?? colorMap.blue

  return (
    <div className={`bg-white rounded-xl border ${c.border} p-5 flex items-start gap-4 hover:shadow-sm transition-all duration-200`}>
      <div className={`${c.iconBg} ${c.text} p-3 rounded-xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {title}
        </p>
        <p className={`text-2xl font-bold leading-none mb-1 ${c.text}`}>{value}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  )
}

export default async function KaderDashboardPage() {
  const session = await auth()
  const kaderId = session?.user?.id
  const kaderName = session?.user?.name || "Kader"

  const [
    totalBalita,
    totalBumil,
    pemeriksaanTerbaru,
    allPemeriksaan,
    posyanduNama,
  ] = await Promise.all([
    prisma.balita.count({
      where: { isAktif: true, posyanduId: session?.user?.posyanduId },
    }),
    prisma.bumil.count({
      where: { isAktif: true, posyanduId: session?.user?.posyanduId },
    }),
    prisma.pemeriksaanBalita.findMany({
      take: 10,
      orderBy: { tanggalPeriksa: "desc" },
      include: {
        balita: { select: { namaLengkap: true, jenisKelamin: true } },
      },
      where: { kaderId },
    }),
    prisma.pemeriksaanBalita.findMany({
      where: { kaderId, statusGizi: { not: null }, statusStunting: { not: null } },
      orderBy: { tanggalPeriksa: "desc" },
      distinct: ["balitaId"],
      select: { statusGizi: true, statusStunting: true },
    }),
    prisma.posyandu.findUnique({
      where: { id: session?.user?.posyanduId || "" },
      select: { nama: true },
    }),
  ])

  const pemeriksaanDenganZ = allPemeriksaan

  const stunting = pemeriksaanDenganZ.filter(
    (p) => labelStunting(p.statusStunting!).isStunting
  ).length

  const giziBuruk = pemeriksaanDenganZ.filter(
    (p) => p.statusGizi === "GIZI_BURUK"
  ).length

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

  const adaPemeriksaan = pemeriksaanDenganZ.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Kader</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {posyanduNama?.nama ?? "Posyandu"} • {tanggal}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right text-xs text-gray-500">
            <div>Login sebagai</div>
            <div className="font-medium text-gray-900">{kaderName}</div>
          </div>
          <LogoutButton className="hidden sm:flex" />
        </div>
      </div>

      {(stunting > 0 || giziBuruk > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">Perhatian: Kasus Prioritas</p>
            <p className="text-xs text-red-700 mt-0.5">
              {stunting > 0 && `${stunting} balita terdeteksi stunting (TB/U < -2 SD). `}
              {giziBuruk > 0 && `${giziBuruk} balita dengan gizi buruk memerlukan penanganan segera.`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Balita"
          value={totalBalita}
          sub="Terdaftar"
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Ibu Hamil"
          value={totalBumil}
          sub="Terdaftar"
          color="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {adaPemeriksaan && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-0.5">
                Status Stunting (TB/U)
              </h2>
              <p className="text-xs text-gray-500 mb-4">Distribusi klasifikasi tinggi badan</p>
              <StuntingBarChart data={stuntingBarData} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Pemeriksaan Terbaru</h2>
          <Link
            href="/kader/pemeriksaan"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Lihat semua →
          </Link>
        </div>

        {pemeriksaanTerbaru.length === 0 ? (
          <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7 20l10-10V20H7z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">Belum ada pemeriksaan</p>
            <p className="text-xs text-gray-400 mt-1">Input data pemeriksaan untuk melihat statistik</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Nama Balita", "JK", "BB (kg)", "TB (cm)", "Status Gizi", "Tanggal"].map(
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