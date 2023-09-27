import {
  DecryptedItemInterface,
  DecryptedPayload,
  FileContent,
  FileItem,
  FillItemContent,
  NoteContent,
  PayloadSource,
  PayloadTimestampDefaults,
  SNNote,
  SNTag,
  TagContent,
  VaultListingInterface,
} from '@standardnotes/models'
import {
  SyncServiceInterface,
  ItemManagerInterface,
  InternalEventBusInterface,
  VaultService,
  AlertService,
  ChangeVaultKeyOptions,
  CreateVault,
  DeleteVault,
  GetVault,
  GetVaults,
  IsVaultOwner,
  MoveItemsToVault,
  MutatorClientInterface,
  RemoveItemFromVault,
  RotateVaultKey,
  SendVaultDataChangedMessage,
  ValidateVaultPassword,
  VaultLockServiceInterface,
} from '../..'
import { AuthorizeVaultDeletion } from './UseCase/AuthorizeVaultDeletion'
import { ContentType } from '@standardnotes/domain-core'

let currentId = 0

const mockUuid = () => {
  return `${currentId++}`
}

const createNoteWithContent = (content: Partial<NoteContent>, createdAt?: Date): SNNote => {
  return new SNNote(
    new DecryptedPayload(
      {
        uuid: mockUuid(),
        content_type: ContentType.TYPES.Note,
        content: FillItemContent<NoteContent>(content),
        ...PayloadTimestampDefaults(),
        created_at: createdAt || new Date(),
      },
      PayloadSource.Constructor,
    ),
  )
}

const createFile = (name: string) => {
  return new FileItem(
    new DecryptedPayload({
      uuid: mockUuid(),
      content_type: ContentType.TYPES.File,
      content: FillItemContent<FileContent>({
        name: name,
      }),
      ...PayloadTimestampDefaults(),
    }),
  )
}

const createTagWithContent = (content: Partial<TagContent>, key_system_identifier?: string): SNTag => {
  return new SNTag(
    new DecryptedPayload(
      {
        uuid: mockUuid(),
        content_type: ContentType.TYPES.Tag,
        content: FillItemContent<TagContent>(content),
        key_system_identifier,
        ...PayloadTimestampDefaults(),
      },
      PayloadSource.Constructor,
    ),
  )
}

describe('VaultService', () => {
  let sync: SyncServiceInterface
  let items: ItemManagerInterface
  let mutator: MutatorClientInterface
  let vaultLocks: VaultLockServiceInterface
  let alerts: AlertService
  let _getVault: GetVault
  let _getVaults: GetVaults
  let _changeVaultKeyOptions: ChangeVaultKeyOptions
  let _moveItemsToVault: MoveItemsToVault
  let _createVault: CreateVault
  let _removeItemFromVault: RemoveItemFromVault
  let _deleteVault: DeleteVault
  let _rotateVaultKey: RotateVaultKey
  let _sendVaultDataChangeMessage: SendVaultDataChangedMessage
  let _isVaultOwner: IsVaultOwner
  let _validateVaultPassword: ValidateVaultPassword
  let _authorizeVaultDeletion: AuthorizeVaultDeletion
  let eventBus: InternalEventBusInterface
  let service: VaultService

  beforeEach(() => {
    sync = {} as jest.Mocked<SyncServiceInterface>
    items = {} as jest.Mocked<ItemManagerInterface>
    mutator = {} as jest.Mocked<MutatorClientInterface>

    vaultLocks = {} as jest.Mocked<VaultLockServiceInterface>
    vaultLocks.isVaultLocked = jest.fn()

    alerts = {} as jest.Mocked<AlertService>
    alerts.alertV2 = jest.fn().mockResolvedValue({})

    eventBus = {} as jest.Mocked<InternalEventBusInterface>

    _getVault = {} as jest.Mocked<GetVault>
    _getVaults = {} as jest.Mocked<GetVaults>
    _changeVaultKeyOptions = {} as jest.Mocked<ChangeVaultKeyOptions>
    _moveItemsToVault = {} as jest.Mocked<MoveItemsToVault>
    _moveItemsToVault.execute = jest.fn().mockResolvedValue({})
    _createVault = {} as jest.Mocked<CreateVault>
    _removeItemFromVault = {} as jest.Mocked<RemoveItemFromVault>
    _deleteVault = {} as jest.Mocked<DeleteVault>
    _rotateVaultKey = {} as jest.Mocked<RotateVaultKey>
    _sendVaultDataChangeMessage = {} as jest.Mocked<SendVaultDataChangedMessage>
    _isVaultOwner = {} as jest.Mocked<IsVaultOwner>
    _validateVaultPassword = {} as jest.Mocked<ValidateVaultPassword>
    _authorizeVaultDeletion = {} as jest.Mocked<AuthorizeVaultDeletion>

    service = new VaultService(
      sync,
      items,
      mutator,
      vaultLocks,
      alerts,
      _getVault,
      _getVaults,
      _changeVaultKeyOptions,
      _moveItemsToVault,
      _createVault,
      _removeItemFromVault,
      _deleteVault,
      _rotateVaultKey,
      _sendVaultDataChangeMessage,
      _isVaultOwner,
      _validateVaultPassword,
      _authorizeVaultDeletion,
      eventBus,
    )
  })

  describe('moveItemToVault', () => {
    it('should throw error if vault is locked', async () => {
      vaultLocks.isVaultLocked = jest.fn().mockReturnValue(true)

      const vault = {
        uuid: '123',
      } as VaultListingInterface
      const item = {
        uuid: '456',
      } as DecryptedItemInterface

      await expect(service.moveItemToVault(vault, item)).rejects.toThrow('Attempting to add item to locked vault')
    })

    describe('moving note/file into vault', () => {
      it('should not move note/file if any item linked to it is already in another vault', async () => {
        const vault = {
          uuid: '123',
          systemIdentifier: '456',
        } as VaultListingInterface

        const note = createNoteWithContent({ title: 'a' })
        const file = createFile('b')

        const returnValue = [
          {
            uuid: '789',
            key_system_identifier: '234',
          },
          {
            uuid: '012',
          },
        ] as DecryptedItemInterface[]

        items.getItemLinkedFiles = jest.fn().mockReturnValue(returnValue)
        items.getItemLinkedNotes = jest.fn().mockReturnValue(returnValue)
        items.getUnsortedTagsForItem = jest.fn().mockReturnValue(returnValue)

        const result = await service.moveItemToVault(vault, note)
        expect(result.isFailed()).toBe(true)

        const result2 = await service.moveItemToVault(vault, file)
        expect(result2.isFailed()).toBe(true)
      })
    })

    describe('moving tag into vault', () => {
      it('should not move tag if any deeply nested subtag is already in another vault', async () => {
        const vault = {
          uuid: '123',
          systemIdentifier: '456',
        } as VaultListingInterface

        const parentTag = createTagWithContent({ title: 'a' })
        const subTag = createTagWithContent({ title: 'b' }, '123')
        const anotherSubTag = createTagWithContent({ title: 'c' })

        items.getDeepTagChildren = jest.fn().mockReturnValue([subTag, anotherSubTag])

        const result = await service.moveItemToVault(vault, parentTag)
        expect(result.isFailed()).toBe(true)
      })

      it('should move parent tag and all deeply nested subtags into vault', async () => {
        const vault = {
          uuid: '123',
          systemIdentifier: '456',
        } as VaultListingInterface

        const parentTag = createTagWithContent({ title: 'a' })
        const subTag = createTagWithContent({ title: 'b' })
        const anotherSubTag = createTagWithContent({ title: 'c' })

        items.getDeepTagChildren = jest.fn().mockReturnValue([subTag, anotherSubTag])
        items.findSureItem = jest.fn().mockReturnValue(parentTag.uuid)

        const result = await service.moveItemToVault(vault, parentTag)
        expect(result.isFailed()).toBe(false)
      })
    })
  })
})
