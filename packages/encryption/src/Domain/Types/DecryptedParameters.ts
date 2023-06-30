import { ItemContent, PersistentSignatureData } from '@standardnotes/models'

export type DecryptedParameters<C extends ItemContent = ItemContent> = {
  uuid: string
  content: C
  signatureData: PersistentSignatureData
}
