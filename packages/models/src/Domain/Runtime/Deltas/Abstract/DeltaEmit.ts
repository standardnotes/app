import { extendArray } from '@standardnotes/utils'
import { EncryptedPayloadInterface, FullyFormedPayloadInterface, PayloadEmitSource } from '../../../Abstract/Payload'
import { SyncResolvedPayload } from '../Utilities/SyncResolvedPayload'

export type DeltaEmit<P extends FullyFormedPayloadInterface = FullyFormedPayloadInterface> = {
  emits: P[]
  ignored?: EncryptedPayloadInterface[]
  source: PayloadEmitSource
}

export type SyncDeltaEmit = {
  emits: SyncResolvedPayload[]
  ignored?: EncryptedPayloadInterface[]
  source: PayloadEmitSource
}

export type SourcelessSyncDeltaEmit = {
  emits: SyncResolvedPayload[]
  ignored: EncryptedPayloadInterface[]
}

export function extendSyncDelta(base: SyncDeltaEmit, extendWith: SourcelessSyncDeltaEmit): void {
  extendArray(base.emits, extendWith.emits)
  if (extendWith.ignored) {
    if (!base.ignored) {
      base.ignored = []
    }
    extendArray(base.ignored, extendWith.ignored)
  }
}
