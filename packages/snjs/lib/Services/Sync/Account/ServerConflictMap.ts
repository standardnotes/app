import { ConflictType, ConflictParams } from '@standardnotes/responses'
import { FullyFormedPayloadInterface, TrustedConflictParams } from '@standardnotes/models'

export type TrustedServerConflictMap = Partial<Record<ConflictType, TrustedConflictParams[]>>
export type DecryptedServerConflictMap = Partial<Record<ConflictType, ConflictParams<FullyFormedPayloadInterface>[]>>
