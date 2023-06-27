import {
  NoteContent,
  SNNote,
  FillItemContent,
  DecryptedPayload,
  PayloadTimestampDefaults,
  MutationType,
  FileItem,
  SNTag,
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

    const alerts = {} as jest.Mocked<AlertService>
    alerts.alert = jest.fn()

    mutatorService = new MutatorService(itemManager, payloadManager, alerts, internalEventBus)
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
      const note = {
        uuid: 'note',
        key_system_identifier: '123',
      } as jest.Mocked<SNNote>

      const file = {
        uuid: 'file',
        key_system_identifier: '456',
      } as jest.Mocked<FileItem>

      const result = await mutatorService.associateFileWithNote(file, note)

      expect(result).toBeUndefined()
    })

    it('attempting to link vaulted tag with non vaulted note should not be permissable', async () => {
      const note = {
        uuid: 'note',
        key_system_identifier: undefined,
      } as jest.Mocked<SNNote>

      const tag = {
        uuid: 'tag',
        key_system_identifier: '456',
      } as jest.Mocked<SNTag>

      const result = await mutatorService.addTagToNote(note, tag, true)

      expect(result).toBeUndefined()
    })

    it('attempting to link vaulted tag with note belonging to different vault should not be perpermissable', async () => {
      const note = {
        uuid: 'note',
        key_system_identifier: '123',
      } as jest.Mocked<SNNote>

      const tag = {
        uuid: 'tag',
        key_system_identifier: '456',
      } as jest.Mocked<SNTag>

      const result = await mutatorService.addTagToNote(note, tag, true)

      expect(result).toBeUndefined()
    })
  })
})
