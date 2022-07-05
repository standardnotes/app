import { SNApplication, Environment, Platform, SNLog } from '../../../snjs'
import WebDeviceInterface from './web_device_interface'
import { SNWebCrypto } from '../../../sncrypto-web'
import { ClassicFileApi } from './classic_file_api'
import { FileSystemApi } from './file_system_api'

SNLog.onLog = console.log
SNLog.onError = console.error

console.log('Clearing localStorage...')
localStorage.clear()

/**
 * Important:
 * If reusing e2e docker servers, you must edit docker/auth.env ACCESS_TOKEN_AGE
 * and REFRESH_TOKEN_AGE and increase their ttl.
 */

const host = 'http://localhost:3123'
const mocksHost = 'http://localhost:3124'

const application = new SNApplication({
  environment: Environment.Web,
  platform: Platform.MacWeb,
  deviceInterface: new WebDeviceInterface(),
  crypto: new SNWebCrypto(),
  alertService: {
    confirm: async () => true,
    alert: async () => {
      alert()
    },
    blockingDialog: () => () => {
      confirm()
    },
  },
  identifier: `${Math.random()}`,
  defaultHost: host,
  appVersion: '1.0.0',
})

console.log('Created application', application)

export async function publishMockedEvent(eventType: string, eventPayload: unknown): Promise<void> {
  await fetch(`${mocksHost}/events`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType,
      eventPayload,
    }),
  })
}

const run = async () => {
  console.log('Preparing for launch...')
  await application.prepareForLaunch({
    receiveChallenge: () => {
      console.warn('Ignoring challenge')
    },
  })
  await application.launch()
  console.log('Application launched...')

  const email = String(Math.random())
  const password = String(Math.random())

  console.log('Registering account...')
  await application.register(email, password)
  console.log(`Registered account ${email}/${password}. Be sure to edit docker/auth.env to increase session TTL.`)

  console.log('Creating mock subscription...')
  await publishMockedEvent('SUBSCRIPTION_PURCHASED', {
    userEmail: email,
    subscriptionId: 1,
    subscriptionName: 'PLUS_PLAN',
    subscriptionExpiresAt: (new Date().getTime() + 3_600_000) * 1_000,
    timestamp: Date.now(),
    offline: false,
  })
  console.log('Successfully created mock subscription...')

  new ClassicFileApi(application)
  new FileSystemApi(application)
}

void run()
