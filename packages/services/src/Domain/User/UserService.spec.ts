import { DecryptErroredPayloads } from './../Encryption/UseCase/DecryptErroredPayloads'
import { ReencryptTypeAItems } from './../Encryption/UseCase/TypeA/ReencryptTypeAItems'
import { EncryptionProviderInterface } from './../Encryption/EncryptionProviderInterface'
import { UserApiServiceInterface } from '@standardnotes/api'
import { UserRequestType } from '@standardnotes/common'
import { User } from '@standardnotes/responses'

import {
  AlertService,
  ChallengeServiceInterface,
  InternalEventBusInterface,
  ItemManagerInterface,
  ProtectionsClientInterface,
} from '..'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { UserService } from './UserService'

describe('UserService', () => {
  let sessionManager: SessionsClientInterface
  let syncService: SyncServiceInterface
  let storageService: StorageServiceInterface
  let itemManager: ItemManagerInterface
  let encryptionService: EncryptionProviderInterface
  let alertService: AlertService
  let challengeService: ChallengeServiceInterface
  let protectionService: ProtectionsClientInterface
  let userApiService: UserApiServiceInterface
  let reencryptTypeAItems: ReencryptTypeAItems
  let decryptErroredPayloads: DecryptErroredPayloads
  let internalEventBus: InternalEventBusInterface

  const createService = () =>
    new UserService(
      sessionManager,
      syncService,
      storageService,
      itemManager,
      encryptionService,
      alertService,
      challengeService,
      protectionService,
      userApiService,
      reencryptTypeAItems,
      decryptErroredPayloads,
      internalEventBus,
    )

  beforeEach(() => {
    sessionManager = {} as jest.Mocked<SessionsClientInterface>
    sessionManager.getSureUser = jest.fn().mockReturnValue({ uuid: '1-2-3' } as jest.Mocked<User>)

    syncService = {} as jest.Mocked<SyncServiceInterface>

    storageService = {} as jest.Mocked<StorageServiceInterface>

    itemManager = {} as jest.Mocked<ItemManagerInterface>

    encryptionService = {} as jest.Mocked<EncryptionProviderInterface>

    alertService = {} as jest.Mocked<AlertService>

    challengeService = {} as jest.Mocked<ChallengeServiceInterface>

    protectionService = {} as jest.Mocked<ProtectionsClientInterface>

    userApiService = {} as jest.Mocked<UserApiServiceInterface>

    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
  })

  it('should submit a user request to the server', async () => {
    userApiService.submitUserRequest = jest.fn().mockReturnValue({ data: { success: true } })

    expect(await createService().submitUserRequest(UserRequestType.ExitDiscount)).toBeTruthy()
  })

  it('should indicate error if submit a user request to the server fails', async () => {
    userApiService.submitUserRequest = jest.fn().mockReturnValue({ data: { success: false } })

    expect(await createService().submitUserRequest(UserRequestType.ExitDiscount)).toBeFalsy()
  })

  it('should indicate error if submit a user request to the server fails with an error on server side', async () => {
    userApiService.submitUserRequest = jest.fn().mockReturnValue({ data: { error: { message: 'fail' } } })

    expect(await createService().submitUserRequest(UserRequestType.ExitDiscount)).toBeFalsy()
  })

  it('should indicate error if submitting a user request throws an exception', async () => {
    userApiService.submitUserRequest = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    expect(await createService().submitUserRequest(UserRequestType.ExitDiscount)).toBeFalsy()
  })
})
