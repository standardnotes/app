import { OfflineSyncSavedContextualPayload } from '@standardnotes/models'

export class OfflineSyncResponse {
  constructor(public readonly savedPayloads: OfflineSyncSavedContextualPayload[]) {}
}
