import { DecryptedItemInterface } from '@standardnotes/models'

export type ImportDataResult = {
  // Items that were either created or dirtied by this import
  affectedItems: DecryptedItemInterface[]

  // The number of items that were not imported due to failure to decrypt.
  errorCount: number
}
