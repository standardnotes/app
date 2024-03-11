import WebDeviceInterface from './web_device_interface.js'
import FakeWebCrypto from './fake_web_crypto.js'
import * as Defaults from './Defaults.js'

export function createApplicationWithOptions({ identifier, environment, platform, host, crypto, device, syncCallsThresholdPerMinute }) {
  if (!device) {
    device = new WebDeviceInterface()
    device.environment = environment
  }

  return new SNApplication({
    environment: environment || Environment.Web,
    platform: platform || Platform.MacWeb,
    deviceInterface: device,
    crypto: crypto || new FakeWebCrypto(),
    alertService: {
      confirm: async () => true,
      alert: async () => {},
      blockingDialog: () => () => {},
    },
    identifier: identifier || `${Math.random()}`,
    defaultHost: host || Defaults.getDefaultHost(),
    appVersion: Defaults.getAppVersion(),
    webSocketUrl: Defaults.getDefaultWebSocketUrl(),
    apiVersion: ApiVersion.v0,
    syncCallsThresholdPerMinute,
  })
}

export function createApplication(identifier, environment, platform, host, crypto, syncCallsThresholdPerMinute) {
  return createApplicationWithOptions({ identifier, environment, platform, host, crypto, syncCallsThresholdPerMinute })
}

export function createApplicationWithFakeCrypto(identifier, environment, platform, host) {
  return createApplication(identifier, environment, platform, host, new FakeWebCrypto())
}

export function createApplicationWithRealCrypto(identifier, environment, platform, host) {
  return createApplication(identifier, environment, platform, host, new SNWebCrypto())
}

export async function createAppWithRandNamespace(environment, platform) {
  const namespace = Math.random().toString(36).substring(2, 15)
  return createApplication(namespace, environment, platform)
}

export async function createInitAppWithFakeCrypto(environment, platform) {
  const namespace = Math.random().toString(36).substring(2, 15)
  return createAndInitializeApplication(namespace, environment, platform, undefined, new FakeWebCrypto())
}

export async function createInitAppWithRealCrypto(environment, platform) {
  const namespace = Math.random().toString(36).substring(2, 15)
  return createAndInitializeApplication(namespace, environment, platform, undefined, new SNWebCrypto())
}

export async function createAndInitializeApplication(namespace, environment, platform, host, crypto) {
  const application = createApplication(namespace, environment, platform, host, crypto)
  await initializeApplication(application)
  return application
}

export async function initializeApplication(application) {
  await application.prepareForLaunch({
    receiveChallenge: (challenge) => {
      console.warn('Factory received potentially unhandled challenge', challenge)
      if (challenge.reason !== ChallengeReason.Custom) {
        throw Error("Factory application shouldn't have challenges")
      }
    },
  })
  await application.launch(true)
}
