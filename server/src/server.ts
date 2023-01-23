// importações
import Fastify from "fastify";
import cors from '@fastify/cors'
import { appRoutes } from "./routes";

// cria a aplicação
const app = Fastify()

// ativando cors pro front conseguir acessar o back
app.register(cors)

app.register(appRoutes)

// agora usa o método listen para que a nossa aplicação ouça a porta 3333
app.listen({
    port: 3333,
    host: '0.0.0.0',
}).then(() => {
    console.log('HTTP Server running!');
})
