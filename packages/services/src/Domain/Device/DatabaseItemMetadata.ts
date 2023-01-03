import { TransferPayload } from '@standardnotes/models'

export type DatabaseItemMetadata = Pick<TransferPayload, 'uuid' | 'updated_at' | 'content_type'>
