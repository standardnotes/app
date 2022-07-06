import { HexString } from '../Types/HexString'
import { Unencrypted } from '../Types/Unencrypted'

/**
 * @param unencrypted -- UTF-8 string or a `string` with `encoding`
 * @param iv initialization vector as a hex string
 * @param key encryption key as a hex string
 * @param aad additional authenticated data as a hex string
 */
export type Aes256GcmInput<EncodingType> = {
  unencrypted: Unencrypted<EncodingType>
  iv: HexString
  key: HexString
  aad?: HexString
}
