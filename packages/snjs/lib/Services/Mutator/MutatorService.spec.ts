import {
  NoteContent,
  SNNote,
  FillItemContent,
  DecryptedPayload,
  PayloadTimestampDefaults,
  MutationType,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { InternalEventBusInterface } from '@standardnotes/services'
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

    mutatorService = new MutatorService(itemManager, payloadManager, internalEventBus)
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
})
