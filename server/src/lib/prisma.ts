import { PrismaClient } from '@prisma/client'

// criando a conexão com o banco de dados
export const prisma = new PrismaClient({
    log: ['query']
})