import {
  DecryptedPayloadInterface,
  DeletedPayloadInterface,
  DeltaEmit,
  EncryptedPayloadInterface,
  FullyFormedPayloadInterface,
  PayloadEmitSource,
} from '@standardnotes/models'

export type EmitQueue<P extends FullyFormedPayloadInterface> = QueueElement<P>[]

export type PayloadManagerChangeData = {
  /** The payloads are pre-existing but have been changed */
  changed: FullyFormedPayloadInterface[]

  /** The payloads have been newly inserted */
  inserted: FullyFormedPayloadInterface[]

  /** The payloads have been deleted from local state (and remote state if applicable) */
  discarded: DeletedPayloadInterface[]

  /** Payloads for which encrypted overwrite protection is enabled and enacted */
  ignored: EncryptedPayloadInterface[]

  /** Payloads which were previously error decrypting but now successfully decrypted */
  unerrored: DecryptedPayloadInterface[]

  source: PayloadEmitSource

  sourceKey?: string
}

export type PayloadsChangeObserverCallback = (data: PayloadManagerChangeData) => void

export type PayloadsChangeObserver = {
  types: string[]
  callback: PayloadsChangeObserverCallback
  priority: number
}

export type QueueElement<P extends FullyFormedPayloadInterface = FullyFormedPayloadInterface> = {
  emit: DeltaEmit
  sourceKey?: string
  resolve: (alteredPayloads: P[]) => void
}
