import {client as WebSocketClient} from 'websocket'
const SOCKET_ADDRESS = 'wss://testnet-ws.smartbit.com.au/v1/blockchain'

const subscribe = (connection, address) => connection.sendUTF(JSON.stringify({
  type: 'address',
  address
}))

const log = (type, payload) => console.log(`[${(new Date()).toGMTString()}][${type}]${payload ? '[' + payload + ']' : ''}`)

const noop = () => {}

export default {
  connect: ({ address, onPayment = noop, onError = noop, timeout }) => {
    const client = new WebSocketClient()

    log('connecting')

    client.on('connect', connection => {
      log('connection_successful')

      connection.on('error', error => {
        log('connection_error', error.toString())
        onError('connection_error', error)
      })

      connection.on('close', () => {
        log('connection_closed')
        onError('connection_closed')
      })

      connection.on('message', message => {
        if (message.type === 'utf8' && 'utf8Data' in message) {
          try {
            const messageParsed = JSON.parse(message.utf8Data)
            log('message_received', messageParsed.type)

            if (messageParsed.type == 'address') {
              log('payment_received')
              onPayment(messageParsed)
            }
          } catch (error) {
            log('message_parsing_error')
          }
        }
      })

      log('subscribing')
      subscribe(connection, address)

      setInterval(() => {
        log('subscription_ping')
        subscribe(connection, address)
      }, timeout)
    })

    client.on('connectFailed', error => {
      onError('connection_failed', error)
    })

    client.connect(SOCKET_ADDRESS)

    return client.connection
  }
}
