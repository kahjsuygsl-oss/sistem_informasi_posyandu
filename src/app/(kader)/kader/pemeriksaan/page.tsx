import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import PemeriksaanTable from "@/app/(admin)/admin/pemeriksaan/PemeriksaanTable"

export default async function KaderPemeriksaanPage() {
  const session = await auth()
  const posyanduId = session?.user?.posyanduId

  const [pemeriksaanList, balitaList] = await Promise.all([
    prisma.pemeriksaanBalita.findMany({
      where: posyanduId ? { balita: { posyanduId } } : {},
      orderBy: { tanggalPeriksa: "desc" },
      take: 100,
      include: {
        balita: { select: { namaLengkap: true, jenisKelamin: true } },
        kader:  { select: { name: true } },
      },
    }),
    prisma.balita.findMany({
      where: {
        isAktif: true,
        ...(posyanduId ? { posyanduId } : {}),
      },
      select: { id: true, namaLengkap: true, jenisKelamin: true, tanggalLahir: true },
      orderBy: { namaLengkap: "asc" },
    }),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Data Pemeriksaan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Input pemeriksaan balita · Z-Score dihitung otomatis dari standar WHO
        </p>
      </div>
      <PemeriksaanTable
        pemeriksaanList={pemeriksaanList}
        balitaList={balitaList}
        canDelete={false}
      />
    </div>
  )
}
