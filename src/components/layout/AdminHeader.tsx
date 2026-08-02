import { auth } from "@/auth"
import { signOut } from "@/auth"

export default async function AdminHeader({ title }: { title: string }) {
  const session = await auth()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 leading-tight">
            {session?.user?.name ?? "Admin"}
          </p>
          <p className="text-xs text-gray-500 leading-tight">
            {session?.user?.posyanduNama ?? "Admin Posyandu"}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
          {(session?.user?.name ?? "A").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
