import WebPush from 'web-push'
import { FastifyInstance } from "fastify";
import { z } from 'zod';

const publicKey = 'BNWRUlcFot5YiMAGpzegkJwOxI5qTJZ0M4hgQC8vflS3fi8wOCcpWoXLIA9PaulKtZTjP42SyafH3XFea0R8UGk'
const privateKey = '2V10pMjJFFM60V_MvJx0qipUuSSxSe7KdhAK3BK8YQ4'

WebPush.setVapidDetails(
    // host
    'http://localhost:3333',
    // chave pública
    publicKey,
    // chave privada
    privateKey,
)

export async function notificationRoutes(app: FastifyInstance) {
  // rota pro front pegar a chave pública
  app.get('/push/public_key', () => {
    return {
        publicKey,
    }
  })

  // conectar o usuário logado com ids de notificação
  app.post('/push/register', (request, reply) => {
    // não faz nada por enquanto
    console.log(request.body);

    return reply.status(201).send()
  })

  app.post('/push/send', async (request, reply) => {
    const sendPushBody = z.object({
        subscription: z.object({
            endpoint: z.string(),
            keys: z.object({
                p256dh: z.string(),
                auth: z.string()
            })
        })
    })

    const { subscription } = sendPushBody.parse(request.body)

    // WebPush.sendNotification(subscription, 'HELLO DO BACK')

    return reply.status(201).send()
  })
}