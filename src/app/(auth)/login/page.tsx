import { Metadata } from "next"
import LoginForm from "./LoginForm"

export const metadata: Metadata = {
  title: "Login",
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Posyandu Digital</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Informasi Posyandu</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Selamat datang</h2>
          <p className="text-sm text-gray-500 mb-6">Masuk untuk melanjutkan</p>

          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Kabupaten Lombok Timur · Nusa Tenggara Barat
        </p>
      </div>
    </main>
  )
}
