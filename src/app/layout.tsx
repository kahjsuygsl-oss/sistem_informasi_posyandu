import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Posyandu Digital - Sistem Informasi Posyandu",
    template: "%s | Posyandu Digital",
  },
  description:
    "Sistem informasi posyandu untuk pencatatan dan pemantauan status gizi serta stunting balita dan ibu hamil berdasarkan standar Z-Score WHO.",
  applicationName: "Posyandu Digital",
  // Aplikasi ini sepenuhnya di balik login dan memuat data pribadi warga (NIK, riwayat
  // kesehatan) — tidak boleh diindeks mesin pencari.
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Posyandu Digital - Sistem Informasi Posyandu",
    description:
      "Sistem informasi posyandu untuk pencatatan dan pemantauan status gizi serta stunting balita dan ibu hamil berdasarkan standar Z-Score WHO.",
    siteName: "Posyandu Digital",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
