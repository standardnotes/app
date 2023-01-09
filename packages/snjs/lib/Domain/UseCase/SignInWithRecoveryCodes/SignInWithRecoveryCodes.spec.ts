import {
  AuthClientInterface,
  InternalEventBusInterface,
  KeyValueStoreInterface,
  SessionsClientInterface,
} from '@standardnotes/services'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { AnyKeyParamsContent } from '@standardnotes/common'
import { DecryptedPayloadInterface, RootKeyContent, RootKeyInterface } from '@standardnotes/models'
import { SessionBody } from '@standardnotes/responses'

import { SignInWithRecoveryCodes } from './SignInWithRecoveryCodes'

describe('SignInWithRecoveryCodes', () => {
  let authManager: AuthClientInterface
  let protocolService: EncryptionProviderInterface
  let inMemoryStore: KeyValueStoreInterface<string>
  let crypto: PureCryptoInterface
  let sessionManager: SessionsClientInterface
  let internalEventBus: InternalEventBusInterface

  const createUseCase = () => new SignInWithRecoveryCodes(
    authManager,
    protocolService,
    inMemoryStore,
    crypto,
    sessionManager,
    internalEventBus,
  )

  beforeEach(() => {
    authManager = {} as jest.Mocked<AuthClientInterface>
    authManager.recoveryKeyParams = jest.fn().mockReturnValue({
      identifier: 'test@test.te',
      pw_nonce: 'pw_nonce',
      created: new Date().toISOString(),
      /** The event that lead to the creation of these params */
      origination: 'register',
      version: '004',
    })
    authManager.signInWithRecoveryCodes = jest.fn()

    const rootKey = {
      serverPassword: 'foobar',
    } as jest.Mocked<RootKeyInterface>
    const payload = {} as jest.Mocked<DecryptedPayloadInterface<RootKeyContent>>
    payload.ejected = jest.fn().mockReturnValue({
      uuid: 'uuid',
    })
    rootKey.payload = payload

    protocolService = {} as jest.Mocked<EncryptionProviderInterface>
    protocolService.hasAccount = jest.fn()
    protocolService.computeRootKey = jest.fn().mockReturnValue(rootKey)
    protocolService.platformSupportsKeyDerivation = jest.fn().mockReturnValue(true)
    protocolService.supportedVersions = jest.fn().mockReturnValue([
      '001',
      '002',
      '003',
      '004',
    ])
    protocolService.isVersionNewerThanLibraryVersion = jest.fn()

    inMemoryStore = {} as jest.Mocked<KeyValueStoreInterface<string>>
    inMemoryStore.setValue = jest.fn()
    inMemoryStore.removeValue = jest.fn()

    crypto = {} as jest.Mocked<PureCryptoInterface>
    crypto.generateRandomKey = jest.fn()
    crypto.base64URLEncode = jest.fn()
    crypto.sha256 = jest.fn()

    sessionManager = {} as jest.Mocked<SessionsClientInterface>
    sessionManager.handleAuthentication = jest.fn()

    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publishSync = jest.fn()
  })

  it('should fail if an account already exists', async () => {
    protocolService.hasAccount = jest.fn().mockReturnValue(true)

    const useCase = createUseCase()
    const result = await useCase.execute({ recoveryCodes: 'recovery-codes', password: 'foobar', username: 'test@test.te' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Tried to sign in when an account already exists.')
  })

  it('should fail if recovery key params could not be retrieved', async () => {
    authManager.recoveryKeyParams = jest.fn().mockReturnValue(false)

    const useCase = createUseCase()
    const result = await useCase.execute({ recoveryCodes: 'recovery-codes', password: 'foobar', username: 'test@test.te' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not retrieve recovery key params')
  })

  it('should fail if key params has unsupported deriviation', async () => {
    protocolService.platformSupportsKeyDerivation = jest.fn().mockReturnValue(false)

    const useCase = createUseCase()
    const result = await useCase.execute({ recoveryCodes: 'recovery-codes', password: 'foobar', username: 'test@test.te' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Your account was created on a platform with higher security capabilities than this browser supports. If we attempted to generate your login keys here, it would take hours. Please use a browser with more up to date security capabilities, like Google Chrome or Firefox, to log in.')
  })

  it('should fail if key params has unsupported version', async () => {
    protocolService.isVersionNewerThanLibraryVersion = jest.fn().mockReturnValue(true)

    authManager.recoveryKeyParams = jest.fn().mockReturnValue({
      identifier: 'test@test.te',
      pw_nonce: 'pw_nonce',
      created: new Date().toISOString(),
      /** The event that lead to the creation of these params */
      origination: 'register',
      version: '006',
    })

    protocolService.platformSupportsKeyDerivation = jest.fn().mockReturnValue(false)

    const useCase = createUseCase()
    const result = await useCase.execute({ recoveryCodes: 'recovery-codes', password: 'foobar', username: 'test@test.te' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('This version of the application does not support your newer account type. Please upgrade to the latest version of Standard Notes to sign in.')
  })

  it('should fail if key params has expired version', async () => {
    protocolService.isVersionNewerThanLibraryVersion = jest.fn().mockReturnValue(false)

    authManager.recoveryKeyParams = jest.fn().mockReturnValue({
      identifier: 'test@test.te',
      pw_nonce: 'pw_nonce',
      created: new Date().toISOString(),
      /** The event that lead to the creation of these params */
      origination: 'register',
      version: '006',
    })

    protocolService.platformSupportsKeyDerivation = jest.fn().mockReturnValue(false)

    const useCase = createUseCase()
    const result = await useCase.execute({ recoveryCodes: 'recovery-codes', password: 'foobar', username: 'test@test.te' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('The protocol version associated with your account is outdated and no longer supported by this application. Please visit standardnotes.com/help/security for more information.')
  })

  it('should fail if the sign in with recovery codes fails', async () => {
    authManager.signInWithRecoveryCodes = jest.fn().mockReturnValue(false)

    const useCase = createUseCase()
    const result = await useCase.execute({ recoveryCodes: 'recovery-codes', password: 'foobar', username: 'test@test.te' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not sign in with recovery codes')
  })

  it('should sign in with recovery codes', async () => {
    authManager.signInWithRecoveryCodes = jest.fn().mockReturnValue({
      keyParams: {} as AnyKeyParamsContent,
      session: {} as SessionBody,
      user: {
        uuid: '1-2-3',
        email: 'test@test.te',
        protocolVersion: '004',
      }
    })

    const useCase = createUseCase()
    const result = await useCase.execute({ recoveryCodes: 'recovery-codes', password: 'foobar', username: 'test@test.te' })

    expect(result.isFailed()).toBe(false)
  })
})
