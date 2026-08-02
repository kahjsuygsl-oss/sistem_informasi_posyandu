/*
  Warnings:

  - You are about to drop the column `statusWasting` on the `PemeriksaanBalita` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bumil" ADD COLUMN "hpht" DATETIME;
ALTER TABLE "Bumil" ADD COLUMN "hpl" DATETIME;
ALTER TABLE "Bumil" ADD COLUMN "usiaKehamilan" INTEGER;

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PemeriksaanBalita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tanggalPeriksa" DATETIME NOT NULL,
    "umurBulan" INTEGER NOT NULL,
    "beratBadan" REAL NOT NULL,
    "tinggiBadan" REAL NOT NULL,
    "posisiUkur" TEXT NOT NULL DEFAULT 'TERLENTANG',
    "lingkarKepala" REAL,
    "lingkarLengan" REAL,
    "zScoreBBU" REAL,
    "zScoreTBU" REAL,
    "zScoreBBTB" REAL,
    "statusBBU" TEXT,
    "statusStunting" TEXT,
    "statusGizi" TEXT,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "balitaId" TEXT NOT NULL,
    "kaderId" TEXT NOT NULL,
    CONSTRAINT "PemeriksaanBalita_balitaId_fkey" FOREIGN KEY ("balitaId") REFERENCES "Balita" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PemeriksaanBalita_kaderId_fkey" FOREIGN KEY ("kaderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PemeriksaanBalita" ("balitaId", "beratBadan", "catatan", "createdAt", "id", "kaderId", "lingkarKepala", "lingkarLengan", "statusGizi", "statusStunting", "tanggalPeriksa", "tinggiBadan", "umurBulan", "updatedAt", "zScoreBBTB", "zScoreBBU", "zScoreTBU") SELECT "balitaId", "beratBadan", "catatan", "createdAt", "id", "kaderId", "lingkarKepala", "lingkarLengan", "statusGizi", "statusStunting", "tanggalPeriksa", "tinggiBadan", "umurBulan", "updatedAt", "zScoreBBTB", "zScoreBBU", "zScoreTBU" FROM "PemeriksaanBalita";
DROP TABLE "PemeriksaanBalita";
ALTER TABLE "new_PemeriksaanBalita" RENAME TO "PemeriksaanBalita";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
