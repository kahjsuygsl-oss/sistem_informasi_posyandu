import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import BalitaDetailView from "@/components/balita/BalitaDetailView"

export default async function DetailBalitaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const balita = await prisma.balita.findUnique({
    where: { id },
    include: {
      posyandu: true,
      pemeriksaan: {
        orderBy: { tanggalPeriksa: "desc" },
        include: { kader: { select: { name: true } } },
      },
    },
  })

  if (!balita) notFound()

  return <BalitaDetailView balita={balita} backHref="/admin/balita" />
}
