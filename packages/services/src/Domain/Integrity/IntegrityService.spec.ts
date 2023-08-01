import { TransferPayload } from '@standardnotes/models'
import { SyncEvent } from '../Event/SyncEvent'

import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { ItemsServerInterface } from '../Item/ItemsServerInterface'
import { SyncSource } from '../Sync/SyncSource'
import { IntegrityApiInterface } from './IntegrityApiInterface'
import { IntegrityService } from './IntegrityService'
import { PayloadManagerInterface } from '../Payloads/PayloadManagerInterface'
import { IntegrityPayload } from '@standardnotes/responses'
import { LoggerInterface } from '@standardnotes/utils'

describe('IntegrityService', () => {
  let integrityApi: IntegrityApiInterface
  let itemApi: ItemsServerInterface
  let payloadManager: PayloadManagerInterface
  let logger: LoggerInterface
  let internalEventBus: InternalEventBusInterface

  const createService = () => new IntegrityService(integrityApi, itemApi, payloadManager, logger, internalEventBus)

  beforeEach(() => {
    integrityApi = {} as jest.Mocked<IntegrityApiInterface>
    integrityApi.checkIntegrity = jest.fn()

    itemApi = {} as jest.Mocked<ItemsServerInterface>
    itemApi.getSingleItem = jest.fn()

    payloadManager = {} as jest.Mocked<PayloadManagerInterface>
    payloadManager.integrityPayloads = []

    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publishSync = jest.fn()

    logger = {} as jest.Mocked<LoggerInterface>
    logger.info = jest.fn()
    logger.error = jest.fn()
  })

  it('should check integrity of payloads and publish mismatches', async () => {
    integrityApi.checkIntegrity = jest.fn().mockReturnValue({
      data: {
        mismatches: [{ uuid: '1-2-3', updated_at_timestamp: 234 } as IntegrityPayload],
      },
    })
    itemApi.getSingleItem = jest.fn().mockReturnValue({
      data: {
        item: {
          uuid: '1-2-3',
          content: 'foobar',
        } as Partial<TransferPayload>,
      },
    })

    await createService().handleEvent({
      type: SyncEvent.SyncRequestsIntegrityCheck,
      payload: {
        integrityPayloads: [{ uuid: '1-2-3', updated_at_timestamp: 123 } as IntegrityPayload],
        source: SyncSource.AfterDownloadFirst,
      },
    })

    expect(internalEventBus.publishSync).toHaveBeenCalledWith(
      {
        payload: {
          rawPayloads: [
            {
              content: 'foobar',
              uuid: '1-2-3',
            },
          ],
          source: 'AfterDownloadFirst',
        },
        type: 'IntegrityCheckCompleted',
      },
      'SEQUENCE',
    )
  })

  it('should publish empty mismatches if everything is in sync', async () => {
    integrityApi.checkIntegrity = jest.fn().mockReturnValue({
      data: {
        mismatches: [],
      },
    })

    await createService().handleEvent({
      type: SyncEvent.SyncRequestsIntegrityCheck,
      payload: {
        integrityPayloads: [{ uuid: '1-2-3', updated_at_timestamp: 123 } as IntegrityPayload],
        source: SyncSource.AfterDownloadFirst,
      },
    })

    expect(internalEventBus.publishSync).toHaveBeenCalledWith(
      {
        payload: {
          rawPayloads: [],
          source: 'AfterDownloadFirst',
        },
        type: 'IntegrityCheckCompleted',
      },
      'SEQUENCE',
    )
  })

  it('should not publish mismatches if checking integrity fails', async () => {
    integrityApi.checkIntegrity = jest.fn().mockReturnValue({
      data: {
        error: 'Ooops',
      },
    })

    await createService().handleEvent({
      type: SyncEvent.SyncRequestsIntegrityCheck,
      payload: {
        integrityPayloads: [{ uuid: '1-2-3', updated_at_timestamp: 123 } as IntegrityPayload],
        source: SyncSource.AfterDownloadFirst,
      },
    })

    expect(internalEventBus.publishSync).not.toHaveBeenCalled()
  })

  it('should publish empty mismatches if fetching items fails', async () => {
    integrityApi.checkIntegrity = jest.fn().mockReturnValue({
      data: {
        mismatches: [{ uuid: '1-2-3', updated_at_timestamp: 234 } as IntegrityPayload],
      },
    })
    itemApi.getSingleItem = jest.fn().mockReturnValue({
      data: {
        error: 'Ooops',
      },
    })

    await createService().handleEvent({
      type: SyncEvent.SyncRequestsIntegrityCheck,
      payload: {
        integrityPayloads: [{ uuid: '1-2-3', updated_at_timestamp: 123 } as IntegrityPayload],
        source: SyncSource.AfterDownloadFirst,
      },
    })

    expect(internalEventBus.publishSync).toHaveBeenCalledWith(
      {
        payload: {
          rawPayloads: [],
          source: 'AfterDownloadFirst',
        },
        type: 'IntegrityCheckCompleted',
      },
      'SEQUENCE',
    )
  })

  it('should not handle different event types', async () => {
    await createService().handleEvent({
      type: SyncEvent.SyncCompletedWithAllItemsUploaded,
      payload: {
        integrityPayloads: [{ uuid: '1-2-3', updated_at_timestamp: 123 } as IntegrityPayload],
        source: SyncSource.AfterDownloadFirst,
      },
    })

    expect(integrityApi.checkIntegrity).not.toHaveBeenCalled()
    expect(itemApi.getSingleItem).not.toHaveBeenCalled()
    expect(internalEventBus.publishSync).not.toHaveBeenCalled()
  })
})
