import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Buat posyandu default
  const posyandu = await prisma.posyandu.upsert({
    where: { id: "posyandu-embung-sempait" },
    update: {},
    create: {
      id: "posyandu-embung-sempait",
      nama: "Embung Sempait",
      desa: "Rumbuk Timur",
      kecamatan: "Sakra",
      kabupaten: "Lombok Timur",
      provinsi: "Nusa Tenggara Barat",
    },
  })
  console.log(`✅ Posyandu: ${posyandu.nama}`)

  const hashPassword = (plain: string) => bcrypt.hash(plain, 12)

  const superadmin = await prisma.user.upsert({
    where: { email: "superadmin@posyandu.id" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@posyandu.id",
      password: await hashPassword("superadmin123"),
      role: "SUPERADMIN",
    },
  })
  console.log(`✅ Superadmin: ${superadmin.email}`)

  const admin = await prisma.user.upsert({
    where: { email: "admin@posyandu.id" },
    update: {},
    create: {
      name: "Admin Posyandu",
      email: "admin@posyandu.id",
      password: await hashPassword("admin123"),
      role: "ADMIN",
      posyanduId: posyandu.id,
    },
  })
  console.log(`✅ Admin: ${admin.email}`)

  const kader = await prisma.user.upsert({
    where: { email: "kader@posyandu.id" },
    update: {},
    create: {
      name: "Kader Posyandu",
      email: "kader@posyandu.id",
      password: await hashPassword("kader123"),
      role: "KADER",
      posyanduId: posyandu.id,
    },
  })
  console.log(`✅ Kader: ${kader.email}`)

  console.log("\n📋 Akun default:")
  console.log("  Superadmin → superadmin@posyandu.id / superadmin123")
  console.log("  Admin      → admin@posyandu.id / admin123")
  console.log("  Kader      → kader@posyandu.id / kader123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
