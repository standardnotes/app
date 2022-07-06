import { HexString } from '../Types/HexString'
import { Aes256GcmEncrypted } from './Aes256GcmEncrypted'
import { Aes256GcmInput } from './Aes256GcmInput'

export interface CryptoAes256GcmInterface<EncodingType> {
  /**
   * Encrypts a string using AES-GCM.
   * @param input
   * @returns An object which can be run through aes256GcmDecrypt to retrieve the input text.
   */
  aes256GcmEncrypt(input: Aes256GcmInput<EncodingType>): Promise<Aes256GcmEncrypted<EncodingType>>

  /**
   * Decrypts a string using AES-GCM.
   * @param encrypted
   * @param key - encryption key as a hex string
   * @returns A string encoded with encoding provided in the input
   */
  aes256GcmDecrypt(encrypted: Aes256GcmEncrypted<EncodingType>, key: HexString): Promise<string>
}
