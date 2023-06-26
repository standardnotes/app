import {
  NoteContent,
  SNNote,
  FillItemContent,
  DecryptedPayload,
  PayloadTimestampDefaults,
  MutationType,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { AlertService, InternalEventBusInterface } from '@standardnotes/services'
import { MutatorService, PayloadManager, ItemManager } from '../'
import { UuidGenerator } from '@standardnotes/utils'

const setupRandomUuid = () => {
  UuidGenerator.SetGenerator(() => String(Math.random()))
}

describe('mutator service', () => {
  let mutatorService: MutatorService
  let payloadManager: PayloadManager
  let itemManager: ItemManager

  let internalEventBus: InternalEventBusInterface

  beforeEach(() => {
    setupRandomUuid()
    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publish = jest.fn()

    payloadManager = new PayloadManager(internalEventBus)
    itemManager = new ItemManager(payloadManager, internalEventBus)

    mutatorService = new MutatorService(itemManager, payloadManager, {} as jest.Mocked<AlertService>, internalEventBus)
  })

  const insertNote = (title: string) => {
    const note = new SNNote(
      new DecryptedPayload({
        uuid: String(Math.random()),
        content_type: ContentType.Note,
        content: FillItemContent<NoteContent>({
          title: title,
        }),
        ...PayloadTimestampDefaults(),
      }),
    )
    return mutatorService.insertItem(note)
  }

  describe('note modifications', () => {
    it('pinning should not update timestamps', async () => {
      const note = await insertNote('hello')
      const pinnedNote = await mutatorService.changeItem(
        note,
        (mutator) => {
          mutator.pinned = true
        },
        MutationType.NoUpdateUserTimestamps,
      )

      expect(note.userModifiedDate).toEqual(pinnedNote?.userModifiedDate)
    })
  })

  describe('linking', () => {
    it('attempting to link file and note should not be allowed if items belong to different vaults', async () => {
      application.mutator.associateFileWithNote = jest.fn()

      const note = createNote('test', {
        uuid: 'note',
        references: [],
      })

      const file = createFile('test', {
        uuid: 'file',
        references: [],
      })

      const noteVault = {
        uuid: 'note-vault',
      } as jest.Mocked<VaultListingInterface>

      const fileVault = {
        uuid: 'file-vault',
      } as jest.Mocked<VaultListingInterface>

      application.vaults.getItemVault = jest.fn().mockImplementation((item: ItemInterface) => {
        if (item.uuid === note.uuid) {
          return noteVault
        } else if (item.uuid === file.uuid) {
          return fileVault
        }
      })

      const alertSpy = (application.alerts.alert = jest.fn())

      await linkingController.linkItems(note, file)

      expect(alertSpy).toHaveBeenCalled()
    })

    it('attempting to link vaulted tag with non vaulted note should not be permissble', async () => {})

    it('attempting to link vaulted tag with note belonging to different vault should not be permisslbe', async () => {})
  })
})
