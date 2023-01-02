import { TransferPayload } from '@standardnotes/snjs'

export type ItemMetadata = Pick<TransferPayload, 'updated_at' | 'content_type'>
