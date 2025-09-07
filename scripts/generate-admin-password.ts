import bcrypt from "bcryptjs"

const password = process.argv[2]

if (!password) {
  console.error("Usage: ts-node scripts/generate-admin-password.ts <password>")
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 10)
console.log(`Hashed password: ${hash}`)
