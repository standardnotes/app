import { PayloadEmitSource } from '../../Payload'
import { DecryptedItemInterface } from '../Interfaces/DecryptedItem'
import { DeletedItemInterface } from '../Interfaces/DeletedItem'
import { EncryptedItemInterface } from '../Interfaces/EncryptedItem'

export type ItemStream<I extends DecryptedItemInterface> = (data: {
  changed: I[]
  inserted: I[]
  removed: (DeletedItemInterface | EncryptedItemInterface)[]
  source: PayloadEmitSource
}) => void
