import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import UserTable from "@/app/(superadmin)/superadmin/users/UserTable"

export default async function AdminKaderPage() {
  const session = await auth()
  const posyanduId = session?.user?.posyanduId

  const users = await prisma.user.findMany({
    where: { role: "KADER", ...(posyanduId ? { posyanduId } : {}) },
    include: { posyandu: { select: { nama: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kelola Akun Kader</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Tambah, ubah, nonaktifkan, atau reset kata sandi akun kader posyandu Anda
        </p>
      </div>
      <UserTable
        data={users}
        canAssignRole={false}
        fixedRole="KADER"
        currentUserId={session?.user?.id ?? ""}
      />
    </div>
  )
}
