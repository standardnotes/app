import { Environment, ApplicationIdentifier } from '@standardnotes/models'
import { DeviceInterface } from '@standardnotes/services'

/**
 * A storage reader reads storage via a device interface
 * given a specific version of SNJS
 */
export abstract class StorageReader {
  constructor(
    protected deviceInterface: DeviceInterface,
    protected identifier: ApplicationIdentifier,
    protected environment: Environment,
  ) {}

  public static version(): string {
    throw Error('Must override')
  }

  public abstract getAccountKeyParams(): Promise<unknown | undefined>

  /**
   * Returns true if the state of storage has account keys present
   * in version-specific storage (either keychain or raw storage)
   */
  public abstract hasNonWrappedAccountKeys(): Promise<boolean>

  public abstract hasPasscode(): Promise<boolean>

  /** Whether this version used the keychain to store keys */
  public abstract usesKeychain(): boolean
}
