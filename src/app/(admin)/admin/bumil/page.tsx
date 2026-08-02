import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import BumilTable from "./BumilTable"

export default async function AdminBumilPage() {
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
          Kelola data ibu hamil terdaftar di posyandu
        </p>
      </div>
      <BumilTable data={bumilList} />
    </div>
  )
}
