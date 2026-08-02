import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import UserTable from "./UserTable"

export default async function SuperadminUsersPage() {
  const session = await auth()

  const [users, posyanduList] = await Promise.all([
    prisma.user.findMany({
      include: { posyandu: { select: { nama: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.posyandu.findMany({
      where: { isActive: true },
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kelola Akun Pengguna</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Kelola akun Superadmin, Admin, dan Kader di seluruh posyandu
        </p>
      </div>
      <UserTable
        data={users}
        canAssignRole
        posyanduList={posyanduList}
        currentUserId={session?.user?.id ?? ""}
      />
    </div>
  )
}
