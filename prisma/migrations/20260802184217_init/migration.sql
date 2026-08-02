-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'KADER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "posyanduId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Posyandu" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "desa" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL DEFAULT 'NUSA TENGGARA BARAT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Posyandu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balita" (
    "id" TEXT NOT NULL,
    "nik" TEXT,
    "namaLengkap" TEXT NOT NULL,
    "tanggalLahir" TIMESTAMP(3) NOT NULL,
    "jenisKelamin" TEXT NOT NULL,
    "namaOrangTua" TEXT NOT NULL,
    "dusun" TEXT,
    "alamat" TEXT,
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "posyanduId" TEXT NOT NULL,

    CONSTRAINT "Balita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PemeriksaanBalita" (
    "id" TEXT NOT NULL,
    "tanggalPeriksa" TIMESTAMP(3) NOT NULL,
    "umurBulan" INTEGER NOT NULL,
    "beratBadan" DOUBLE PRECISION NOT NULL,
    "tinggiBadan" DOUBLE PRECISION NOT NULL,
    "posisiUkur" TEXT NOT NULL DEFAULT 'TERLENTANG',
    "lingkarKepala" DOUBLE PRECISION,
    "lingkarLengan" DOUBLE PRECISION,
    "zScoreBBU" DOUBLE PRECISION,
    "zScoreTBU" DOUBLE PRECISION,
    "zScoreBBTB" DOUBLE PRECISION,
    "statusBBU" TEXT,
    "statusStunting" TEXT,
    "statusGizi" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "balitaId" TEXT NOT NULL,
    "kaderId" TEXT NOT NULL,

    CONSTRAINT "PemeriksaanBalita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bumil" (
    "id" TEXT NOT NULL,
    "nik" TEXT,
    "namaLengkap" TEXT NOT NULL,
    "namaSuami" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "dusun" TEXT,
    "alamat" TEXT,
    "usiaKehamilan" INTEGER,
    "hpht" TIMESTAMP(3),
    "hpl" TIMESTAMP(3),
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "posyanduId" TEXT NOT NULL,

    CONSTRAINT "Bumil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PemeriksaanBumil" (
    "id" TEXT NOT NULL,
    "tanggalPeriksa" TIMESTAMP(3) NOT NULL,
    "usiaKandungan" INTEGER,
    "kehamilanKe" INTEGER,
    "paritas" INTEGER,
    "abortus" INTEGER,
    "hpht" TIMESTAMP(3),
    "hpl" TIMESTAMP(3),
    "beratBadan" DOUBLE PRECISION,
    "tinggiBadan" DOUBLE PRECISION,
    "lingkarLengan" DOUBLE PRECISION,
    "imt" DOUBLE PRECISION,
    "tekananDarah" TEXT,
    "statusKek" BOOLEAN NOT NULL DEFAULT false,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bumilId" TEXT NOT NULL,
    "kaderId" TEXT NOT NULL,

    CONSTRAINT "PemeriksaanBumil_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Balita_nik_key" ON "Balita"("nik");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_posyanduId_fkey" FOREIGN KEY ("posyanduId") REFERENCES "Posyandu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balita" ADD CONSTRAINT "Balita_posyanduId_fkey" FOREIGN KEY ("posyanduId") REFERENCES "Posyandu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PemeriksaanBalita" ADD CONSTRAINT "PemeriksaanBalita_balitaId_fkey" FOREIGN KEY ("balitaId") REFERENCES "Balita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PemeriksaanBalita" ADD CONSTRAINT "PemeriksaanBalita_kaderId_fkey" FOREIGN KEY ("kaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bumil" ADD CONSTRAINT "Bumil_posyanduId_fkey" FOREIGN KEY ("posyanduId") REFERENCES "Posyandu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PemeriksaanBumil" ADD CONSTRAINT "PemeriksaanBumil_bumilId_fkey" FOREIGN KEY ("bumilId") REFERENCES "Bumil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PemeriksaanBumil" ADD CONSTRAINT "PemeriksaanBumil_kaderId_fkey" FOREIGN KEY ("kaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
