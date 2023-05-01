import {
  PayloadInterface,
  EncryptedPayloadInterface,
  FullyFormedPayloadInterface,
  PayloadEmitSource,
  DecryptedPayloadInterface,
  HistoryMap,
} from '@standardnotes/models'
import { IntegrityPayload } from '@standardnotes/responses'

export interface PayloadManagerInterface {
  emitPayloads(
    payloads: PayloadInterface[],
    emitSource: PayloadEmitSource,
    sourceKey?: string,
  ): Promise<PayloadInterface[]>

  integrityPayloads: IntegrityPayload[]

  get invalidPayloads(): EncryptedPayloadInterface[]

  /**
   * Returns a detached array of all items which are not deleted
   */
  get nonDeletedItems(): FullyFormedPayloadInterface[]

  importPayloads(payloads: DecryptedPayloadInterface[], historyMap: HistoryMap): Promise<string[]>
}
