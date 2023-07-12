import { ContentType } from '@standardnotes/domain-core'
import { FillItemContent } from '../../Abstract/Content/ItemContent'
import { DecryptedPayload, FullyFormedPayloadInterface, PayloadTimestampDefaults } from '../../Abstract/Payload'
import { NoteContent } from '../../Syncable/Note'
import { PayloadCollection } from '../Collection/Payload/PayloadCollection'
import { DeltaRemoteRejected } from './RemoteRejected'
import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { ConflictParams, ConflictType } from '@standardnotes/responses'
import { UuidGenerator } from '@standardnotes/utils'

UuidGenerator.SetGenerator(() => String(Math.random()))

describe('remote rejected delta', () => {
  it('rejected payloads should not map onto app state', async () => {
    const baseCollection = new PayloadCollection()
    const basePayload = new DecryptedPayload<NoteContent>({
      uuid: '123',
      content_type: ContentType.TYPES.Note,
      dirty: true,
      content: FillItemContent<NoteContent>({
        title: 'foo',
      }),
      ...PayloadTimestampDefaults(),
      updated_at_timestamp: 1,
    })

    baseCollection.set(basePayload)

    const rejectedPayload = basePayload.copy({
      content: FillItemContent<NoteContent>({
        title: 'rejected',
      }),
      updated_at_timestamp: 3,
      dirty: true,
    })

    const entry: ConflictParams<FullyFormedPayloadInterface> = {
      type: ConflictType.ContentTypeError,
      unsaved_item: rejectedPayload,
    } as unknown as ConflictParams<FullyFormedPayloadInterface>

    const delta = new DeltaRemoteRejected(ImmutablePayloadCollection.FromCollection(baseCollection), [entry])

    const result = delta.result()
    const payload = result.emits[0] as DecryptedPayload<NoteContent>

    expect(payload.content.title).toBe('foo')
    expect(payload.updated_at_timestamp).toBe(1)
    expect(payload.dirty).toBeFalsy()
  })
})
