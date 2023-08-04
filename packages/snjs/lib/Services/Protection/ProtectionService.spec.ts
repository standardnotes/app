import { ChallengeService } from '../Challenge'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { ProtectionService } from './ProtectionService'
import {
  InternalEventBus,
  InternalEventBusInterface,
  ChallengeReason,
  EncryptionService,
  MutatorClientInterface,
} from '@standardnotes/services'
import { UuidGenerator } from '@standardnotes/utils'
import {
  DecryptedPayload,
  FileContent,
  FileItem,
  FillItemContent,
  PayloadTimestampDefaults,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/domain-core'

const setupRandomUuid = () => {
  UuidGenerator.SetGenerator(() => String(Math.random()))
}

describe('protectionService', () => {
  let mutator: MutatorClientInterface
  let encryptionService: EncryptionService
  let challengeService: ChallengeService
  let storageService: DiskStorageService
  let internalEventBus: InternalEventBusInterface
  let protectionService: ProtectionService

  const createService = () => {
    return new ProtectionService(encryptionService, mutator, challengeService, storageService, internalEventBus)
  }

  const createFile = (name: string, isProtected?: boolean) => {
    return new FileItem(
      new DecryptedPayload({
        uuid: String(Math.random()),
        content_type: ContentType.TYPES.File,
        content: FillItemContent<FileContent>({
          name: name,
          protected: isProtected,
        }),
        ...PayloadTimestampDefaults(),
      }),
    )
  }

  beforeEach(() => {
    setupRandomUuid()

    internalEventBus = {} as jest.Mocked<InternalEventBus>

    challengeService = {} as jest.Mocked<ChallengeService>
    challengeService.promptForChallengeResponse = jest.fn()

    storageService = {} as jest.Mocked<DiskStorageService>
    storageService.getValue = jest.fn()

    encryptionService = {} as jest.Mocked<EncryptionService>
    encryptionService.hasAccount = jest.fn().mockReturnValue(true)
    encryptionService.hasPasscode = jest.fn().mockReturnValue(false)

    mutator = {} as jest.Mocked<MutatorClientInterface>
  })

  describe('files', () => {
    it('unprotected file should not require auth', async () => {
      protectionService = createService()

      const unprotectedFile = createFile('protected.txt', false)

      await protectionService.authorizeProtectedActionForItems([unprotectedFile], ChallengeReason.AccessProtectedFile)

      expect(challengeService.promptForChallengeResponse).not.toHaveBeenCalled()
    })

    it('protected file should require auth', async () => {
      protectionService = createService()

      const protectedFile = createFile('protected.txt', true)

      await protectionService.authorizeProtectedActionForItems([protectedFile], ChallengeReason.AccessProtectedFile)

      expect(challengeService.promptForChallengeResponse).toHaveBeenCalled()
    })

    it('array of files having one protected should require auth', async () => {
      protectionService = createService()

      const protectedFile = createFile('protected.txt', true)
      const unprotectedFile = createFile('unprotected.txt', false)

      await protectionService.authorizeProtectedActionForItems(
        [protectedFile, unprotectedFile],
        ChallengeReason.AccessProtectedFile,
      )

      expect(challengeService.promptForChallengeResponse).toHaveBeenCalled()
    })

    it('array of files having none protected should not require auth', async () => {
      protectionService = createService()

      const protectedFile = createFile('protected.txt', false)
      const unprotectedFile = createFile('unprotected.txt', false)

      await protectionService.authorizeProtectedActionForItems(
        [protectedFile, unprotectedFile],
        ChallengeReason.AccessProtectedFile,
      )

      expect(challengeService.promptForChallengeResponse).not.toHaveBeenCalled()
    })
  })
})
