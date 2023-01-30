import './styles/global.css'
import './lib/dayjs'
import { Header } from './components/Header'
import { SummaryTable } from './components/SummaryTable'
import { api } from './lib/axios'

navigator.serviceWorker.register('service-worker.js')
  .then(async serviceWorker => {
    // subscription é a assinatura do usuário com o serviço de notificações
    let subscription = await serviceWorker.pushManager.getSubscription()

    // se não tiver uma inscrição ativa, cria uma nova
    if (!subscription) {
      const publicKeyResponse = await api.get('/push/public_key')

      subscription = await serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKeyResponse.data.publicKey,
      })
    }

    await api.post('/push/register', {
      subscription,
    })

    await api.post('/push/send', {
      subscription,
    })
  })

export default function App() {
  return (
    <div className='w-screen h-screen flex justify-center items-center'>
     <div className='w-full max-w-5xl px-6 flex flex-col gap-16'>
      <Header/>
      <SummaryTable/>
     </div>
    </div>
  )
}

// Componente: Reaproveitar / isolar
// Propriedade: Uma informação enviada para modificar um componente visual ou comportamentalmente
