import {
  DecryptedPayload,
  FillItemContent,
  ItemsKeyContent,
  PayloadEmitSource,
  PayloadTimestampDefaults,
} from '@standardnotes/models'
import { PayloadManager } from './PayloadManager'
import { InternalEventBusInterface } from '@standardnotes/services'
import { ContentType } from '@standardnotes/common'

describe('payload manager', () => {
  let payloadManager: PayloadManager
  let internalEventBus: InternalEventBusInterface

  beforeEach(() => {
    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publish = jest.fn()

    payloadManager = new PayloadManager(internalEventBus)
  })

  it('emitting a payload should emit as-is and not merge on top of existing payload', async () => {
    const decrypted = new DecryptedPayload({
      uuid: '123',
      content_type: ContentType.ItemsKey,
      content: FillItemContent<ItemsKeyContent>({
        itemsKey: 'secret',
      }),
      ...PayloadTimestampDefaults(),
      updated_at_timestamp: 1,
      dirty: true,
    })

    await payloadManager.emitPayload(decrypted, PayloadEmitSource.LocalInserted)

    const nondirty = new DecryptedPayload({
      uuid: '123',
      content_type: ContentType.ItemsKey,
      ...PayloadTimestampDefaults(),
      updated_at_timestamp: 2,
      content: FillItemContent<ItemsKeyContent>({
        itemsKey: 'secret',
      }),
    })

    await payloadManager.emitPayload(nondirty, PayloadEmitSource.LocalChanged)

    const result = payloadManager.findOne('123')

    expect(result?.dirty).toBeFalsy()
  })
})
