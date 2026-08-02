import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import BumilDetailView from "@/components/bumil/BumilDetailView"

export default async function DetailBumilPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const bumil = await prisma.bumil.findUnique({
    where: { id },
    include: {
      posyandu: true,
      pemeriksaan: { orderBy: { tanggalPeriksa: "desc" } },
    },
  })

  if (!bumil) notFound()

  return <BumilDetailView bumil={bumil} backHref="/admin/bumil" />
}
