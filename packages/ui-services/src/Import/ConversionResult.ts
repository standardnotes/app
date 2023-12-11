import { DecryptedItemInterface } from '@standardnotes/models'

export type ConversionResult = {
  successful: DecryptedItemInterface[]
  errored: {
    name: string
    error: Error
  }[]
}
