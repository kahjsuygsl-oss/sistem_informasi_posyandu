import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import BalitaTable from "./BalitaTable"

export default async function AdminBalitaPage() {
  const session = await auth()
  const posyanduId = session?.user?.posyanduId

  const balitaList = await prisma.balita.findMany({
    where: {
      isAktif: true,
      ...(posyanduId ? { posyanduId } : {}),
    },
    include: {
      _count: { select: { pemeriksaan: true } },
      pemeriksaan: {
        orderBy: { tanggalPeriksa: "desc" },
        take: 1,
        select: { statusGizi: true },
      },
    },
    orderBy: { namaLengkap: "asc" },
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Data Balita</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Kelola data balita terdaftar di posyandu
        </p>
      </div>

      <BalitaTable data={balitaList} />
    </div>
  )
}
