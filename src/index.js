import PaymentProvider from './payment-provider'
import Communism from './communism'
import addresses from '../addresses.json'

const twoMinute = 2 * 60 * 1000

let connection

const options = {
  address: addresses.test.normal.publicKey,
  onPayment: () => Communism.spread(),
  onError: (errorType, error) => {
    switch (errorType) {
      case 'connection_closed':
        connection.close()
        connection = PaymentProvider.connect(options)
        break
    }
  },
  timeout: twoMinute
}

connection = PaymentProvider.connect(options)
