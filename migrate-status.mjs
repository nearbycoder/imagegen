import { PrismaClient } from './generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  // Update all existing generations to have status='completed'
  const result = await prisma.generation.updateMany({
    where: {
      status: 'processing',
    },
    data: {
      status: 'completed',
    },
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
