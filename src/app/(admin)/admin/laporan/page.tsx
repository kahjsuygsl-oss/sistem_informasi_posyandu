import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import LaporanView from "@/components/laporan/LaporanView"

export const dynamic = "force-dynamic"

export default async function AdminLaporanPage() {
  const session = await auth()
  const posyanduId = session?.user?.posyanduId

  const [pemeriksaanList, posyandu] = await Promise.all([
    prisma.pemeriksaanBalita.findMany({
      where: posyanduId ? { balita: { posyanduId } } : {},
      orderBy: { tanggalPeriksa: "desc" },
      include: {
        balita: { select: { namaLengkap: true, jenisKelamin: true } },
      },
    }),
    posyanduId ? prisma.posyandu.findUnique({ where: { id: posyanduId } }) : null,
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Laporan Status Gizi & Stunting</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Rekap periodik dan ekspor laporan ke PDF
        </p>
      </div>
      <LaporanView
        data={pemeriksaanList}
        judul="Laporan Status Gizi & Stunting"
        subjudul={posyandu?.nama ?? "Posyandu"}
      />
    </div>
  )
}
