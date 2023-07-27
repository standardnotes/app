import { PkcKeyPair, SodiumTag } from '../Types'
import { Base64String } from '../Types/Base64String'
import { Base64URLSafeString } from '../Types/Base64URLSafeString'
import { HexString } from '../Types/HexString'
import { StreamDecryptor } from '../Types/StreamDecryptor'
import { StreamEncryptor } from '../Types/StreamEncryptor'
import { Utf8String } from '../Types/Utf8String'

/**
 * Interface that clients have to implement to use snjs
 */
export interface PureCryptoInterface {
  initialize(): Promise<void>

  /**
   * Derives a key from a password and salt using PBKDF2 via WebCrypto.
   * @param password - utf8 string
   * @param salt - utf8 string
   * @param iterations
   * @param length - In bits
   * @returns Hex string
   */
  pbkdf2(password: Utf8String, salt: Utf8String, iterations: number, length: number): Promise<string | null>

  /**
   * Generates a random key in hex format
   * @param bits - Length of key in bits
   * @returns A string key in hex format
   */
  generateRandomKey(bits: number): HexString

  /**
   * @legacy
   * Encrypts a string using AES-CBC via WebCrypto.
   * @param plaintext
   * @param iv - In hex format
   * @param key - In hex format
   * @returns Ciphertext in Base64 format.
   */
  aes256CbcEncrypt(plaintext: Utf8String, iv: HexString, key: HexString): Promise<Base64String>

  /**
   * @legacy
   * Decrypts a string using AES-CBC via WebCrypto.
   * @param ciphertext - Base64 format
   * @param iv - In hex format
   * @param key - In hex format
   * @returns Plain utf8 string or null if decryption fails
   */
  aes256CbcDecrypt(ciphertext: Base64String, iv: HexString, key: HexString): Promise<Utf8String | null>

  /**
   * Runs HMAC with SHA-256 on a message with key.
   * @param message - Plain utf8 string
   * @param key - In hex format
   * @returns Hex string or null if computation fails
   */
  hmac256(message: Utf8String, key: HexString): Promise<HexString | null>

  /**
   * @param text - Plain utf8 string
   * @returns Hex string
   */
  sha256(text: string): Promise<string>

  /**
   * Runs HMAC with SHA-1 on a message with key.
   * @param message - Plain utf8 string
   * @param key - In hex format
   * @returns Hex string or null if computation fails
   */
  hmac1(message: Utf8String, key: HexString): Promise<HexString | null>

  /**
   * Use only for legacy applications.
   * @param text - Plain utf8 string
   * @returns Hex string
   */
  unsafeSha1(text: string): Promise<string>

  /**
   * Derives a key from a password and salt using
   * argon2id (crypto_pwhash_ALG_DEFAULT).
   * @param password - Plain text string
   * @param salt - Salt in hex format
   * @param iterations - The algorithm's opslimit (recommended min 2)
   * @param bytes - The algorithm's memory limit (memlimit) (recommended min 67108864)
   * @param length - The output key length
   * @returns Derived key in hex format
   */
  argon2(password: Utf8String, salt: HexString, iterations: number, bytes: number, length: number): HexString

  /**
   * Encrypt a message (and associated data) with XChaCha20-Poly1305.
   * @param plaintext
   * @param nonce - In hex format
   * @param key - In hex format
   * @param assocData
   * @returns Base64 ciphertext string
   */
  xchacha20Encrypt(plaintext: Utf8String, nonce: HexString, key: HexString, assocData?: Utf8String): Base64String

  /**
   * Decrypt a message (and associated data) with XChaCha20-Poly1305
   * @param ciphertext
   * @param nonce - In hex format
   * @param key - In hex format
   * @param assocData
   * @returns Plain utf8 string or null if decryption fails
   */
  xchacha20Decrypt(
    ciphertext: Base64String,
    nonce: HexString,
    key: HexString,
    assocData?: Utf8String | Uint8Array,
  ): Utf8String | null

  xchacha20StreamInitEncryptor(key: HexString): StreamEncryptor

  xchacha20StreamEncryptorPush(
    encryptor: StreamEncryptor,
    plainBuffer: Uint8Array,
    assocData: Utf8String,
    tag?: SodiumTag,
  ): Uint8Array

  xchacha20StreamInitDecryptor(header: Base64String, key: HexString): StreamDecryptor

  xchacha20StreamDecryptorPush(
    decryptor: StreamDecryptor,
    encryptedBuffer: Uint8Array,
    assocData: Utf8String,
  ): { message: Uint8Array; tag: SodiumTag } | false

  sodiumCryptoBoxEasyEncrypt(
    message: Utf8String,
    nonce: HexString,
    recipientPublicKey: HexString,
    senderSecretKey: HexString,
  ): Base64String
  sodiumCryptoBoxEasyDecrypt(
    ciphertext: Base64String,
    nonce: HexString,
    senderPublicKey: HexString,
    recipientSecretKey: HexString,
  ): Utf8String

  sodiumCryptoBoxSeedKeypair(seed: HexString): PkcKeyPair
  sodiumCryptoSignSeedKeypair(seed: HexString): PkcKeyPair

  sodiumCryptoSign(message: Utf8String, secretKey: HexString): Base64String
  sodiumCryptoSignVerify(message: Utf8String, signature: Base64String, publicKey: HexString): boolean

  sodiumCryptoKdfDeriveFromKey(key: HexString, subkeyNumber: number, subkeyLength: number, context: string): HexString

  sodiumCryptoGenericHash(message: Utf8String, key?: HexString): HexString

  /**
   * Converts a plain string into base64
   * @param text - A plain string
   * @returns  A base64 encoded string
   */
  base64Encode(text: Utf8String): Base64String

  /**
   * Converts a plain string into url safe base64
   * @param text - A plain string
   * @returns  A base64 url safe encoded string
   */
  base64URLEncode(text: Utf8String): Base64URLSafeString

  /**
   * Converts a base64 string into a plain string
   * @param base64String - A base64 encoded string
   * @returns A plain string
   */
  base64Decode(base64String: Base64String): Utf8String

  deinit(): void

  /**
   * Generates a UUID string syncronously.
   */
  generateUUID(): string

  /**
   * Constant-time string comparison
   * @param a
   * @param b
   */
  timingSafeEqual(a: string, b: string): boolean

  /**
   * Generates a random secret for TOTP authentication
   *
   * RFC4226 reccomends a length of at least 160 bits = 32 b32 chars
   * https://datatracker.ietf.org/doc/html/rfc4226#section-4
   */
  generateOtpSecret(): Promise<string>

  /**
   * Generates a HOTP code as per RFC4226 specification
   * using HMAC-SHA1
   * https://datatracker.ietf.org/doc/html/rfc4226
   *
   * @param secret OTP shared secret
   * @param counter HOTP counter
   * @returns HOTP auth code
   */
  hotpToken(secret: string, counter: number, tokenLength: number): Promise<string>

  /**
   * Generates a TOTP code as per RFC6238 specification
   * using HMAC-SHA1
   * https://datatracker.ietf.org/doc/html/rfc6238
   *
   * @param secret OTP shared secret
   * @param timestamp time specified in milliseconds since UNIX epoch
   * @param step time step specified in seconds
   * @returns TOTP auth code
   */
  totpToken(secret: string, timestamp: number, tokenLength: number, step: number): Promise<string>
}
