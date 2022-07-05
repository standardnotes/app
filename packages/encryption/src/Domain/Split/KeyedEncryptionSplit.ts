import { DecryptedPayloadInterface } from '@standardnotes/models'

import { AbstractKeySplit } from './AbstractKeySplit'

export type KeyedEncryptionSplit = AbstractKeySplit<DecryptedPayloadInterface>
