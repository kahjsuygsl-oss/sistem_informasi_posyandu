import Link from "next/link"
import PemeriksaanKehamilanSection from "./PemeriksaanKehamilanSection"

interface PemeriksaanBumil {
  id: string
  tanggalPeriksa: Date
  usiaKandungan: number | null
  beratBadan: number | null
  tinggiBadan: number | null
  lingkarLengan: number | null
  imt: number | null
  tekananDarah: string | null
  statusKek: boolean
  catatan: string | null
}

interface Bumil {
  id: string
  namaLengkap: string
  nik: string | null
  namaSuami: string | null
  tanggalLahir: Date | null
  dusun: string | null
  alamat: string | null
  usiaKehamilan: number | null
  hpht: Date | null
  hpl: Date | null
  posyandu: { nama: string }
  pemeriksaan: PemeriksaanBumil[]
}

export default function BumilDetailView({
  bumil,
  backHref,
  canDelete = true,
}: {
  bumil: Bumil
  backHref: string
  canDelete?: boolean
}) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={backHref} className="hover:text-purple-600 transition">
          Data Ibu Hamil
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{bumil.namaLengkap}</span>
      </div>

      {/* Profil Bumil */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 bg-purple-100">
            🤰
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{bumil.namaLengkap}</h1>
            {bumil.nik && (
              <p className="text-xs font-mono text-gray-400 mt-0.5">NIK: {bumil.nik}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[
                ["Nama Suami", bumil.namaSuami ?? "—"],
                ["Tanggal Lahir", bumil.tanggalLahir
                  ? new Date(bumil.tanggalLahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                  : "—"],
                ["Usia Kehamilan", bumil.usiaKehamilan !== null ? `${bumil.usiaKehamilan} minggu` : "—"],
                ["HPHT", bumil.hpht
                  ? new Date(bumil.hpht).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                  : "—"],
                ["HPL", bumil.hpl
                  ? new Date(bumil.hpl).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                  : "—"],
                ["Posyandu", bumil.posyandu.nama],
                ["Dusun", bumil.dusun ?? "—"],
                ["Alamat", bumil.alamat ?? "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-500">{k}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat Pemeriksaan Kehamilan */}
      <PemeriksaanKehamilanSection
        bumilId={bumil.id}
        bumilNama={bumil.namaLengkap}
        data={bumil.pemeriksaan}
        canDelete={canDelete}
      />
    </div>
  )
}
