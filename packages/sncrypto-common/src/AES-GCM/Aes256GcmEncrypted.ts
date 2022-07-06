import { Base64String } from '../Types/Base64String'
import { HexString } from '../Types/HexString'

/**
 * @param iv initialization vector as a hex string
 * @param tag authentication tag as a hex string
 * @param ciphertext as a base64 string
 * @param encoding that will be applied after decrypting
 * @param aad additional authenticated data as a hex string
 */
export type Aes256GcmEncrypted<EncodingType> = {
  iv: HexString
  tag: HexString
  ciphertext: Base64String
  encoding: EncodingType
  aad: HexString
}
