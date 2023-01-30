self.addEventListener('push', function (event) {
    const body = event.data?.text() ?? ''

    // .waitUntil() fica rodando até receber uma notificação
    event.waitUntil(
        self.registration.showNotification('Habits', {
            body,
        })
    )
})