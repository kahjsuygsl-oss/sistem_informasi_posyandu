import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import BumilTable from "@/app/(admin)/admin/bumil/BumilTable"

export default async function KaderBumilPage() {
  const session = await auth()
  const posyanduId = session?.user?.posyanduId

  const bumilList = await prisma.bumil.findMany({
    where: {
      isAktif: true,
      ...(posyanduId ? { posyanduId } : {}),
    },
    include: {
      _count: { select: { pemeriksaan: true } },
    },
    orderBy: { namaLengkap: "asc" },
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Data Ibu Hamil</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Tambah ibu hamil baru dan lihat data posyandu Anda
        </p>
      </div>
      <BumilTable data={bumilList} canManage={false} basePath="/kader/bumil" />
    </div>
  )
}
