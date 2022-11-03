import {
  Base64String,
  HexString,
  SNPureCrypto,
  timingSafeEqual,
  Utf8String,
} from '@standardnotes/sncrypto-common';
import { generateUuid } from '../../lib/utils';

/**
 * An SNPureCrypto implementation. Required to create a new SNApplication instance.
 */
export default class SNCrypto implements SNPureCrypto {
  constructor() {}

  public deinit() {}

  public timingSafeEqual(a: string, b: string) {
    return timingSafeEqual(a, b);
  }

  public async pbkdf2(
    password: Utf8String,
    salt: Utf8String,
    iterations: number,
    length: number
  ): Promise<HexString | null> {
    return password;
  }

  public async generateRandomKey(bits: number): Promise<string> {
    return "arandomkey";
  }

  public async aes256CbcEncrypt(
    plaintext: Utf8String,
    iv: HexString,
    key: HexString
  ): Promise<Base64String> {
    return plaintext;
  }

  public async aes256CbcDecrypt(
    ciphertext: Base64String,
    iv: HexString,
    key: HexString
  ): Promise<Utf8String | null> {
    return ciphertext;
  }

  public async hmac256(
    message: Utf8String,
    key: HexString
  ): Promise<HexString | null> {
    return message;
  }

  public async sha256(text: string): Promise<string> {
    return text;
  }

  public async unsafeSha1(text: string): Promise<string> {
    return text;
  }

  public async argon2(
    password: Utf8String,
    salt: string,
    iterations: number,
    bytes: number,
    length: number
  ): Promise<HexString> {
    return password;
  }

  public async xchacha20Encrypt(
    plaintext: Utf8String,
    nonce: HexString,
    key: HexString,
    assocData: Utf8String
  ): Promise<Base64String> {
    return plaintext;
  }

  public async xchacha20Decrypt(
    ciphertext: Base64String,
    nonce: HexString,
    key: HexString,
    assocData: Utf8String
  ): Promise<string | null> {
    return ciphertext;
  }

  public generateUUIDSync() {
    return generateUuid();
  }

  public async generateUUID() {
    return generateUuid();
  }

  public async base64Encode(text: Utf8String): Promise<string> {
    return btoa(text);
  }

  public async base64Decode(base64String: Base64String): Promise<string> {
    return atob(base64String);
  }
}
