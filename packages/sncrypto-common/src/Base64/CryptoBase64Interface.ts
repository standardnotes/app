import { Base64String } from '../Types/Base64String'
import { Utf8String } from '../Types/Utf8String'

export interface CryptoBase64Interface {
  /**
   * Converts a plain string into base64
   * @param text - A plain string
   * @returns  A base64 encoded string
   */
  base64Encode(text: Utf8String): Base64String

  /**
   * Converts a plain string into url-safe base64
   * @param text - A plain string
   * @returns  A base64 encoded string
   */
  base64URLEncode(text: Utf8String): Base64String

  /**
   * Converts a base64 string into a plain string
   * @param base64String - A base64 encoded string
   * @returns A plain string
   */
  base64Decode(base64String: Base64String): Utf8String
}
