import { prisma } from "@/lib/prisma"
import LaporanView from "@/components/laporan/LaporanView"

export const dynamic = "force-dynamic"

export default async function SuperadminLaporanPage() {
  const pemeriksaanList = await prisma.pemeriksaanBalita.findMany({
    orderBy: { tanggalPeriksa: "desc" },
    include: {
      balita: {
        select: { namaLengkap: true, jenisKelamin: true, posyandu: { select: { nama: true } } },
      },
    },
  })

  const data = pemeriksaanList.map((p) => ({ ...p, posyandu: p.balita.posyandu }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Laporan Status Gizi & Stunting</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Rekap periodik seluruh posyandu dan ekspor laporan ke PDF
        </p>
      </div>
      <LaporanView
        data={data}
        judul="Laporan Status Gizi & Stunting"
        subjudul="Semua Posyandu"
        showPosyanduColumn
      />
    </div>
  )
}
