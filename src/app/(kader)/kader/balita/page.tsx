import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import BalitaTable from "@/app/(admin)/admin/balita/BalitaTable"

export default async function KaderBalitaPage() {
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
      <div>
        <h1 className="text-xl font-bold text-gray-900">Data Balita</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Tambah balita baru dan lihat data balita posyandu Anda
        </p>
      </div>

      <BalitaTable data={balitaList} canManage={false} basePath="/kader/balita" />
    </div>
  )
}
