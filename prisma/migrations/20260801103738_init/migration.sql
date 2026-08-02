-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'KADER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "posyanduId" TEXT,
    CONSTRAINT "User_posyanduId_fkey" FOREIGN KEY ("posyanduId") REFERENCES "Posyandu" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Posyandu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "desa" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL DEFAULT 'NUSA TENGGARA BARAT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Balita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nik" TEXT,
    "namaLengkap" TEXT NOT NULL,
    "tanggalLahir" DATETIME NOT NULL,
    "jenisKelamin" TEXT NOT NULL,
    "namaOrangTua" TEXT NOT NULL,
    "alamat" TEXT,
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "posyanduId" TEXT NOT NULL,
    CONSTRAINT "Balita_posyanduId_fkey" FOREIGN KEY ("posyanduId") REFERENCES "Posyandu" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PemeriksaanBalita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tanggalPeriksa" DATETIME NOT NULL,
    "umurBulan" INTEGER NOT NULL,
    "beratBadan" REAL NOT NULL,
    "tinggiBadan" REAL NOT NULL,
    "lingkarKepala" REAL,
    "lingkarLengan" REAL,
    "zScoreBBU" REAL,
    "zScoreTBU" REAL,
    "zScoreBBTB" REAL,
    "statusGizi" TEXT,
    "statusStunting" TEXT,
    "statusWasting" TEXT,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "balitaId" TEXT NOT NULL,
    "kaderId" TEXT NOT NULL,
    CONSTRAINT "PemeriksaanBalita_balitaId_fkey" FOREIGN KEY ("balitaId") REFERENCES "Balita" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PemeriksaanBalita_kaderId_fkey" FOREIGN KEY ("kaderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bumil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nik" TEXT,
    "namaLengkap" TEXT NOT NULL,
    "namaSuami" TEXT,
    "tanggalLahir" DATETIME,
    "alamat" TEXT,
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "posyanduId" TEXT NOT NULL,
    CONSTRAINT "Bumil_posyanduId_fkey" FOREIGN KEY ("posyanduId") REFERENCES "Posyandu" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PemeriksaanBumil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tanggalPeriksa" DATETIME NOT NULL,
    "usiaKandungan" INTEGER,
    "kehamilanKe" INTEGER,
    "paritas" INTEGER,
    "abortus" INTEGER,
    "hpht" DATETIME,
    "hpl" DATETIME,
    "beratBadan" REAL,
    "tinggiBadan" REAL,
    "lingkarLengan" REAL,
    "imt" REAL,
    "tekananDarah" TEXT,
    "statusKek" BOOLEAN NOT NULL DEFAULT false,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bumilId" TEXT NOT NULL,
    "kaderId" TEXT NOT NULL,
    CONSTRAINT "PemeriksaanBumil_bumilId_fkey" FOREIGN KEY ("bumilId") REFERENCES "Bumil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PemeriksaanBumil_kaderId_fkey" FOREIGN KEY ("kaderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Balita_nik_key" ON "Balita"("nik");
