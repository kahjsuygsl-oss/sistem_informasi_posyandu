import { prisma } from "@/lib/prisma"
import PosyanduTable from "./PosyanduTable"

export const dynamic = "force-dynamic"

export default async function PosyanduPage() {
  const posyanduList = await prisma.posyandu.findMany({
    include: {
      _count: { select: { balita: true, bumil: true, users: true } },
    },
    orderBy: { nama: "asc" },
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kelola Posyandu</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Tambah, ubah, atau nonaktifkan posyandu yang terdaftar
        </p>
      </div>
      <PosyanduTable data={posyanduList} />
    </div>
  )
}
