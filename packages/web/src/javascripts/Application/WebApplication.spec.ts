import { Environment, namespacedKey, Platform, RawStorageKey, SNLog } from '@standardnotes/snjs'
import { WebApplication } from '@/Application/WebApplication'
import { WebOrDesktopDevice } from './Device/WebOrDesktopDevice'

describe('web application', () => {
  let application: WebApplication

  // eslint-disable-next-line no-console
  SNLog.onLog = console.log
  SNLog.onError = console.error

  beforeEach(async () => {
    const identifier = '123'

    window.matchMedia = jest.fn().mockReturnValue({ matches: false, addListener: jest.fn() })

    const device = {
      environment: Environment.Desktop,
      appVersion: '1.2.3',
      setApplication: jest.fn(),
      openDatabase: jest.fn().mockReturnValue(Promise.resolve()),
      getRawStorageValue: jest.fn().mockImplementation(async (key) => {
        if (key === namespacedKey(identifier, RawStorageKey.SnjsVersion)) {
          return '10.0.0'
        }
        return undefined
      }),
      setRawStorageValue: jest.fn(),
    } as unknown as jest.Mocked<WebOrDesktopDevice>

    application = new WebApplication(device, Platform.MacWeb, identifier, 'https://sync', 'https://socket')

    await application.prepareForLaunch({ receiveChallenge: jest.fn() })
  })

  it('should create application', () => {
    expect(application).toBeTruthy()
  })
})
