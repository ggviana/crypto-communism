const PaymentProvider = require('./payment-provider')
const Communism = require('./communism')
const addresses = require('../addresses')

const minute = 60 * 1000

let connection

const options = {
  address: addresses.test.publicKey,
  onPayment: () => Communism.spread(),
  onError: (errorType, error) => {
    switch (errorType) {
      case 'connection_closed':
        connection.close()
        connection = PaymentProvider.connect(options)
        break
    }
  },
  timeout: minute
}

connection = PaymentProvider.connect(options)
