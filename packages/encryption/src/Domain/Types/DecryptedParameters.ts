import { ItemContent, PersistentSignatureResult } from '@standardnotes/models'

export type DecryptedParameters<C extends ItemContent = ItemContent> = {
  uuid: string
  content: C
  signature_result: PersistentSignatureResult
}
