import {
  DecryptedPayload,
  FillItemContent,
  ItemsKeyContent,
  PayloadEmitSource,
  PayloadTimestampDefaults,
} from '@standardnotes/models'
import { PayloadManager } from './PayloadManager'
import { InternalEventBusInterface } from '@standardnotes/services'
import { ContentType } from '@standardnotes/domain-core'
import { LoggerInterface } from '@standardnotes/utils'

describe('payload manager', () => {
  let payloadManager: PayloadManager
  let internalEventBus: InternalEventBusInterface
  let logger: LoggerInterface

  beforeEach(() => {
    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publish = jest.fn()

    logger = {} as jest.Mocked<LoggerInterface>
    logger.debug = jest.fn()

    payloadManager = new PayloadManager(logger, internalEventBus)
  })

  it('emitting a payload should emit as-is and not merge on top of existing payload', async () => {
    const decrypted = new DecryptedPayload({
      uuid: '123',
      content_type: ContentType.TYPES.ItemsKey,
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
      content_type: ContentType.TYPES.ItemsKey,
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
