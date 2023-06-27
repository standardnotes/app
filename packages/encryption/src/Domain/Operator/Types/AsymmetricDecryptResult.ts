import { HexString } from '@standardnotes/sncrypto-common'

export type AsymmetricDecryptResult = {
  plaintext: HexString
  signatureVerified: boolean
  signaturePublicKey: string
  senderPublicKey: string
}
