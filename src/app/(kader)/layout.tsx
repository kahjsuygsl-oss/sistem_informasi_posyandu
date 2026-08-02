import KaderSidebar from "@/components/layout/KaderSidebar"

// Layout untuk role Kader — Kader hanya bisa akses data posyandu miliknya sendiri
export default function KaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <KaderSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
