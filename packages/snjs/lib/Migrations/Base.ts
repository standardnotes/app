import { AnyKeyParamsContent, KeyParamsContent004 } from '@standardnotes/common'
import {
  EncryptedPayload,
  EncryptedTransferPayload,
  isErrorDecryptingPayload,
  ContentTypeUsesRootKeyEncryption,
} from '@standardnotes/models'
import { PreviousSnjsVersion1_0_0, PreviousSnjsVersion2_0_0, SnjsVersion } from '../Version'
import { Migration } from '@Lib/Migrations/Migration'
import {
  RawStorageKey,
  namespacedKey,
  ApplicationStage,
  ChallengeValidation,
  ChallengeReason,
  ChallengePrompt,
  KeychainRecoveryStrings,
  SessionStrings,
  Challenge,
} from '@standardnotes/services'
import { assert } from '@standardnotes/utils'
import { CreateReader } from './StorageReaders/Functions'
import { StorageReader } from './StorageReaders/Reader'

/** A key that was briefly present in Snjs version 2.0.0 but removed in 2.0.1 */
const LastMigrationTimeStampKey2_0_0 = 'last_migration_timestamp'

/**
 * The base migration always runs during app initialization. It is meant as a way
 * to set up all other migrations.
 */
export class BaseMigration extends Migration {
  private reader!: StorageReader
  private didPreRun = false
  private memoizedNeedsKeychainRepair?: boolean

  public async preRun() {
    await this.storeVersionNumber()
    this.didPreRun = true
  }

  protected registerStageHandlers() {
    this.registerStageHandler(ApplicationStage.PreparingForLaunch_0, async () => {
      if (await this.needsKeychainRepair()) {
        await this.repairMissingKeychain()
      }
      this.markDone()
    })
  }

  private getStoredVersion() {
    const storageKey = namespacedKey(this.services.identifier, RawStorageKey.SnjsVersion)
    return this.services.deviceInterface.getRawStorageValue(storageKey)
  }

  /**
   * In Snjs 1.x, and Snjs 2.0.0, version numbers were not stored (as they were introduced
   * in 2.0.1). Because migrations can now rely on this value, we want to establish a base
   * value if we do not find it in storage.
   */
  private async storeVersionNumber() {
    const storageKey = namespacedKey(this.services.identifier, RawStorageKey.SnjsVersion)
    const version = await this.getStoredVersion()
    if (!version) {
      /** Determine if we are 1.0.0 or 2.0.0 */
      /** If any of these keys exist in raw storage, we are coming from a 1.x architecture */
      const possibleLegacyKeys = ['migrations', 'ephemeral', 'user', 'cachedThemes', 'syncToken', 'encryptedStorage']
      let hasLegacyValue = false
      for (const legacyKey of possibleLegacyKeys) {
        const value = await this.services.deviceInterface.getRawStorageValue(legacyKey)
        if (value) {
          hasLegacyValue = true
          break
        }
      }
      if (hasLegacyValue) {
        /** Coming from 1.0.0 */
        await this.services.deviceInterface.setRawStorageValue(storageKey, PreviousSnjsVersion1_0_0)
      } else {
        /** Coming from 2.0.0 (which did not store version) OR is brand new application */
        const migrationKey = namespacedKey(this.services.identifier, LastMigrationTimeStampKey2_0_0)
        const migrationValue = await this.services.deviceInterface.getRawStorageValue(migrationKey)
        const is_2_0_0_application = migrationValue != undefined
        if (is_2_0_0_application) {
          await this.services.deviceInterface.setRawStorageValue(storageKey, PreviousSnjsVersion2_0_0)
          await this.services.deviceInterface.removeRawStorageValue(LastMigrationTimeStampKey2_0_0)
        } else {
          /** Is new application, use current version as not to run any migrations */
          await this.services.deviceInterface.setRawStorageValue(storageKey, SnjsVersion)
        }
      }
    }
  }

  private async loadReader() {
    if (this.reader) {
      return
    }

    const version = (await this.getStoredVersion()) as string
    this.reader = CreateReader(
      version,
      this.services.deviceInterface,
      this.services.identifier,
      this.services.environment,
    )
  }

  /**
   * If the keychain is empty, and the user does not have a passcode,
   * AND there appear to be stored account key params, this indicates
   * a launch where the keychain was wiped due to restoring device
   * from cloud backup which did not include keychain. This typically occurs
   * on mobile when restoring from iCloud, but we'll also follow this same behavior
   * on desktop/web as well, since we recently introduced keychain to desktop.
   *
   * We must prompt user for account password, and validate based on ability to decrypt
   * an item. We cannot validate based on storage because 1.x mobile applications did
   * not use encrypted storage, although we did on 2.x. But instead of having two methods
   * of validations best to use one that works on both.
   *
   * The item is randomly chosen, but for 2.x applications, it must be an items key item
   * (since only item keys are encrypted directly with account password)
   */

  public async needsKeychainRepair() {
    if (this.memoizedNeedsKeychainRepair != undefined) {
      return this.memoizedNeedsKeychainRepair
    }

    if (!this.didPreRun) {
      throw Error('Attempting to access specialized function before prerun')
    }

    if (!this.reader) {
      await this.loadReader()
    }

    const usesKeychain = this.reader.usesKeychain
    if (!usesKeychain) {
      /** Doesn't apply if this version did not use a keychain to begin with */
      this.memoizedNeedsKeychainRepair = false
      return this.memoizedNeedsKeychainRepair
    }

    const rawAccountParams = await this.reader.getAccountKeyParams()
    const hasAccountKeyParams = rawAccountParams != undefined
    if (!hasAccountKeyParams) {
      /** Doesn't apply if account is not involved */
      this.memoizedNeedsKeychainRepair = false
      return this.memoizedNeedsKeychainRepair
    }

    const hasPasscode = await this.reader.hasPasscode()
    if (hasPasscode) {
      /** Doesn't apply if using passcode, as keychain would be bypassed in that case */
      this.memoizedNeedsKeychainRepair = false
      return this.memoizedNeedsKeychainRepair
    }

    const accountKeysMissing = !(await this.reader.hasNonWrappedAccountKeys())
    if (!accountKeysMissing) {
      this.memoizedNeedsKeychainRepair = false
      return this.memoizedNeedsKeychainRepair
    }

    this.memoizedNeedsKeychainRepair = true
    return this.memoizedNeedsKeychainRepair
  }

  private async repairMissingKeychain() {
    const rawAccountParams = (await this.reader.getAccountKeyParams()) as AnyKeyParamsContent

    /** Choose an item to decrypt against */
    const allItems = (
      await this.services.deviceInterface.getAllDatabaseEntries<EncryptedTransferPayload>(this.services.identifier)
    ).map((p) => new EncryptedPayload(p))

    let itemToDecrypt = allItems.find((item) => {
      return ContentTypeUsesRootKeyEncryption(item.content_type)
    })

    if (!itemToDecrypt) {
      /** If no root key encrypted item, choose any item */
      itemToDecrypt = allItems[0]
    }

    if (!itemToDecrypt) {
      /**
       * No items to decrypt, user probably cleared their browser data. Only choice is to clear storage
       * as any remainign account data is useless without items
       */
      await this.services.storageService.clearValues()
      return
    }

    /** Prompt for account password */
    const challenge = new Challenge(
      [new ChallengePrompt(ChallengeValidation.None, undefined, SessionStrings.PasswordInputPlaceholder, true)],
      ChallengeReason.Custom,
      false,
      KeychainRecoveryStrings.Title,
      KeychainRecoveryStrings.Text((rawAccountParams as KeyParamsContent004).identifier),
    )

    return new Promise((resolve) => {
      this.services.challengeService.addChallengeObserver(challenge, {
        onNonvalidatedSubmit: async (challengeResponse) => {
          const password = challengeResponse.values[0].value as string
          const accountParams = this.services.encryptionService.createKeyParams(rawAccountParams)
          const rootKey = await this.services.encryptionService.computeRootKey(password, accountParams)

          /** TS can't detect we returned early above if itemToDecrypt is null */
          assert(itemToDecrypt)

          const decryptedPayload = await this.services.encryptionService.decryptSplitSingle({
            usesRootKey: {
              items: [itemToDecrypt],
              key: rootKey,
            },
          })

          if (isErrorDecryptingPayload(decryptedPayload)) {
            /** Wrong password, try again */
            this.services.challengeService.setValidationStatusForChallenge(
              challenge,
              challengeResponse.values[0],
              false,
            )
          } else {
            /**
             * If decryption succeeds, store the generated account key where it is expected.
             */
            const rawKey = rootKey.getKeychainValue()
            await this.services.deviceInterface.setNamespacedKeychainValue(rawKey, this.services.identifier)
            resolve(true)
            this.services.challengeService.completeChallenge(challenge)
          }
        },
      })

      void this.services.challengeService.promptForChallengeResponse(challenge)
    })
  }
}
