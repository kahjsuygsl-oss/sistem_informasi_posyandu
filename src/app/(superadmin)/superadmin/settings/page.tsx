import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const ACTION_LABEL: Record<string, { label: string; cls: string }> = {
  LOGIN:  { label: "Login",  cls: "bg-green-100 text-green-700" },
  LOGOUT: { label: "Logout", cls: "bg-gray-100 text-gray-600" },
}

export default async function SettingsPage() {
  const logs = await prisma.activityLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, role: true } } },
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Log aktivitas login/logout pengguna (FR-04)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Log Aktivitas Terbaru</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-400">Belum ada aktivitas tercatat</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Waktu", "Nama", "Email", "Peran", "Aktivitas"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const info = ACTION_LABEL[log.action] ?? { label: log.action, cls: "bg-gray-100 text-gray-600" }
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {log.createdAt.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{log.user.name}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">{log.user.email}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">{log.user.role}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${info.cls}`}>
                          {info.label}
                        </span>
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
