import { EncryptedPayloadInterface } from '@standardnotes/models'

import { AbstractKeySplit } from './AbstractKeySplit'

export type KeyedDecryptionSplit = AbstractKeySplit<EncryptedPayloadInterface>
