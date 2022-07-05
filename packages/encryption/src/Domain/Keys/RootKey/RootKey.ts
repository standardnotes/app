import { SNRootKeyParams } from './RootKeyParams'
import {
  RootKeyInterface,
  RootKeyContent,
  DecryptedItem,
  DecryptedPayloadInterface,
  RootKeyContentInStorage,
  NamespacedRootKeyInKeychain,
} from '@standardnotes/models'
import { ProtocolVersion } from '@standardnotes/common'
import { timingSafeEqual } from '@standardnotes/sncrypto-common'

/**
 * A root key is a local only construct that houses the key used for the encryption
 * and decryption of items keys. A root key extends SNItem for local convenience, but is
 * not part of the syncing or storage ecosystem—root keys are managed independently.
 */
export class SNRootKey extends DecryptedItem<RootKeyContent> implements RootKeyInterface {
  public readonly keyParams: SNRootKeyParams

  constructor(payload: DecryptedPayloadInterface<RootKeyContent>) {
    super(payload)

    this.keyParams = new SNRootKeyParams(payload.content.keyParams)
  }

  public get keyVersion(): ProtocolVersion {
    return this.content.version
  }

  /**
   * When the root key is used to encrypt items, we use the masterKey directly.
   */
  public get itemsKey(): string {
    return this.masterKey
  }

  public get masterKey(): string {
    return this.content.masterKey
  }

  /**
   * serverPassword is not persisted as part of keychainValue, so if loaded from disk,
   * this value may be undefined.
   */
  public get serverPassword(): string | undefined {
    return this.content.serverPassword
  }

  /** 003 and below only. */
  public get dataAuthenticationKey(): string | undefined {
    return this.content.dataAuthenticationKey
  }

  public compare(otherKey: SNRootKey): boolean {
    if (this.keyVersion !== otherKey.keyVersion) {
      return false
    }

    if (this.serverPassword && otherKey.serverPassword) {
      return (
        timingSafeEqual(this.masterKey, otherKey.masterKey) &&
        timingSafeEqual(this.serverPassword, otherKey.serverPassword)
      )
    } else {
      return timingSafeEqual(this.masterKey, otherKey.masterKey)
    }
  }

  /**
   * @returns Object suitable for persist in storage when wrapped
   */
  public persistableValueWhenWrapping(): RootKeyContentInStorage {
    return {
      ...this.getKeychainValue(),
      keyParams: this.keyParams.getPortableValue(),
    }
  }

  /**
   * @returns Object that is suitable for persisting in a keychain
   */
  public getKeychainValue(): NamespacedRootKeyInKeychain {
    const values: NamespacedRootKeyInKeychain = {
      version: this.keyVersion,
      masterKey: this.masterKey,
    }

    if (this.dataAuthenticationKey) {
      values.dataAuthenticationKey = this.dataAuthenticationKey
    }

    return values
  }
}
