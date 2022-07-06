import { AnyKeyParamsContent, ContentType, ProtocolVersion } from '@standardnotes/common'
import { JwtSession } from '../../Services/Session/Sessions/JwtSession'
import { Migration } from '@Lib/Migrations/Migration'
import { MigrationServices } from '../MigrationServices'
import { PreviousSnjsVersion2_0_0 } from '../../Version'
import { SNRootKey, CreateNewRootKey } from '@standardnotes/encryption'
import { DiskStorageService } from '../../Services/Storage/DiskStorageService'
import { StorageReader1_0_0 } from '../StorageReaders/Versions/Reader1_0_0'
import * as Models from '@standardnotes/models'
import * as Services from '@standardnotes/services'
import * as Utils from '@standardnotes/utils'
import { isEnvironmentMobile, isEnvironmentWebOrDesktop } from '@Lib/Application/Platforms'
import {
  getIncrementedDirtyIndex,
  LegacyMobileKeychainStructure,
  PayloadTimestampDefaults,
} from '@standardnotes/models'
import { isMobileDevice } from '@standardnotes/services'

interface LegacyStorageContent extends Models.ItemContent {
  storage: unknown
}

interface LegacyAccountKeysValue {
  ak: string
  mk: string
  version: string
  jwt: string
}

interface LegacyRootKeyContent extends Models.RootKeyContent {
  accountKeys?: LegacyAccountKeysValue
}

const LEGACY_SESSION_TOKEN_KEY = 'jwt'

export class Migration2_0_0 extends Migration {
  private legacyReader!: StorageReader1_0_0

  constructor(services: MigrationServices) {
    super(services)
    this.legacyReader = new StorageReader1_0_0(
      this.services.deviceInterface,
      this.services.identifier,
      this.services.environment,
    )
  }

  static override version() {
    return PreviousSnjsVersion2_0_0
  }

  protected registerStageHandlers() {
    this.registerStageHandler(Services.ApplicationStage.PreparingForLaunch_0, async () => {
      if (isEnvironmentWebOrDesktop(this.services.environment)) {
        await this.migrateStorageStructureForWebDesktop()
      } else if (isEnvironmentMobile(this.services.environment)) {
        await this.migrateStorageStructureForMobile()
      }
    })
    this.registerStageHandler(Services.ApplicationStage.StorageDecrypted_09, async () => {
      await this.migrateArbitraryRawStorageToManagedStorageAllPlatforms()
      if (isEnvironmentMobile(this.services.environment)) {
        await this.migrateMobilePreferences()
      }
      await this.migrateSessionStorage()
      await this.deleteLegacyStorageValues()
    })
    this.registerStageHandler(Services.ApplicationStage.LoadingDatabase_11, async () => {
      await this.createDefaultItemsKeyForAllPlatforms()
      this.markDone()
    })
  }

  /**
   * Web
   * Migrates legacy storage structure into new managed format.
   * If encrypted storage exists, we need to first decrypt it with the passcode.
   * Then extract the account key from it. Then, encrypt storage with the
   * account key. Then encrypt the account key with the passcode and store it
   * within the new storage format.
   *
   * Generate note: We do not use the keychain if passcode is available.
   */
  private async migrateStorageStructureForWebDesktop() {
    const deviceInterface = this.services.deviceInterface
    const newStorageRawStructure: Services.StorageValuesObject = {
      [Services.ValueModesKeys.Wrapped]: {} as Models.LocalStorageEncryptedContextualPayload,
      [Services.ValueModesKeys.Unwrapped]: {},
      [Services.ValueModesKeys.Nonwrapped]: {},
    }
    const rawAccountKeyParams = (await this.legacyReader.getAccountKeyParams()) as AnyKeyParamsContent
    /** Could be null if no account, or if account and storage is encrypted */
    if (rawAccountKeyParams) {
      newStorageRawStructure.nonwrapped[Services.StorageKey.RootKeyParams] = rawAccountKeyParams
    }
    const encryptedStorage = (await deviceInterface.getJsonParsedRawStorageValue(
      Services.LegacyKeys1_0_0.WebEncryptedStorageKey,
    )) as Models.EncryptedTransferPayload

    if (encryptedStorage) {
      const encryptedStoragePayload = new Models.EncryptedPayload(encryptedStorage)

      const passcodeResult = await this.webDesktopHelperGetPasscodeKeyAndDecryptEncryptedStorage(
        encryptedStoragePayload,
      )

      const passcodeKey = passcodeResult.key
      const decryptedStoragePayload = passcodeResult.decryptedStoragePayload
      const passcodeParams = passcodeResult.keyParams

      newStorageRawStructure.nonwrapped[Services.StorageKey.RootKeyWrapperKeyParams] = passcodeParams.getPortableValue()

      const rawStorageValueStore = Utils.Copy(decryptedStoragePayload.content.storage)
      const storageValueStore: Record<string, unknown> = Utils.jsonParseEmbeddedKeys(rawStorageValueStore)
      /** Store previously encrypted auth_params into new nonwrapped value key */

      const accountKeyParams = storageValueStore[Services.LegacyKeys1_0_0.AllAccountKeyParamsKey] as AnyKeyParamsContent
      newStorageRawStructure.nonwrapped[Services.StorageKey.RootKeyParams] = accountKeyParams

      let keyToEncryptStorageWith = passcodeKey
      /** Extract account key (mk, pw, ak) if it exists */
      const hasAccountKeys = !Utils.isNullOrUndefined(storageValueStore.mk)

      if (hasAccountKeys) {
        const { accountKey, wrappedKey } = await this.webDesktopHelperExtractAndWrapAccountKeysFromValueStore(
          passcodeKey,
          accountKeyParams,
          storageValueStore,
        )
        keyToEncryptStorageWith = accountKey
        newStorageRawStructure.nonwrapped[Services.StorageKey.WrappedRootKey] = wrappedKey
      }

      /** Encrypt storage with proper key */
      newStorageRawStructure.wrapped = await this.webDesktopHelperEncryptStorage(
        keyToEncryptStorageWith,
        decryptedStoragePayload,
        storageValueStore,
      )
    } else {
      /**
       * No encrypted storage, take account keys (if they exist) out of raw storage
       * and place them in the keychain. */
      const ak = await this.services.deviceInterface.getRawStorageValue('ak')
      const mk = await this.services.deviceInterface.getRawStorageValue('mk')

      if (ak || mk) {
        const version = rawAccountKeyParams.version || (await this.getFallbackRootKeyVersion())

        const accountKey = CreateNewRootKey({
          masterKey: mk as string,
          dataAuthenticationKey: ak as string,
          version: version,
          keyParams: rawAccountKeyParams,
        })
        await this.services.deviceInterface.setNamespacedKeychainValue(
          accountKey.getKeychainValue(),
          this.services.identifier,
        )
      }
    }

    /** Persist storage under new key and structure */
    await this.allPlatformHelperSetStorageStructure(newStorageRawStructure)
  }

  /**
   * Helper
   * All platforms
   */
  private async allPlatformHelperSetStorageStructure(rawStructure: Services.StorageValuesObject) {
    const newStructure = DiskStorageService.DefaultValuesObject(
      rawStructure.wrapped,
      rawStructure.unwrapped,
      rawStructure.nonwrapped,
    ) as Partial<Services.StorageValuesObject>

    newStructure[Services.ValueModesKeys.Unwrapped] = undefined

    await this.services.deviceInterface.setRawStorageValue(
      Services.namespacedKey(this.services.identifier, Services.RawStorageKey.StorageObject),
      JSON.stringify(newStructure),
    )
  }

  /**
   * Helper
   * Web/desktop only
   */
  private async webDesktopHelperGetPasscodeKeyAndDecryptEncryptedStorage(
    encryptedPayload: Models.EncryptedPayloadInterface,
  ) {
    const rawPasscodeParams = (await this.services.deviceInterface.getJsonParsedRawStorageValue(
      Services.LegacyKeys1_0_0.WebPasscodeParamsKey,
    )) as AnyKeyParamsContent
    const passcodeParams = this.services.protocolService.createKeyParams(rawPasscodeParams)

    /** Decrypt it with the passcode */
    let decryptedStoragePayload:
      | Models.DecryptedPayloadInterface<LegacyStorageContent>
      | Models.EncryptedPayloadInterface = encryptedPayload
    let passcodeKey: SNRootKey | undefined

    await this.promptForPasscodeUntilCorrect(async (candidate: string) => {
      passcodeKey = await this.services.protocolService.computeRootKey(candidate, passcodeParams)
      decryptedStoragePayload = await this.services.protocolService.decryptSplitSingle({
        usesRootKey: {
          items: [encryptedPayload],
          key: passcodeKey,
        },
      })

      return !Models.isErrorDecryptingPayload(decryptedStoragePayload)
    })

    return {
      decryptedStoragePayload:
        decryptedStoragePayload as unknown as Models.DecryptedPayloadInterface<LegacyStorageContent>,
      key: passcodeKey as SNRootKey,
      keyParams: passcodeParams,
    }
  }

  /**
   * Helper
   * Web/desktop only
   */
  private async webDesktopHelperExtractAndWrapAccountKeysFromValueStore(
    passcodeKey: SNRootKey,
    accountKeyParams: AnyKeyParamsContent,
    storageValueStore: Record<string, unknown>,
  ) {
    const version = accountKeyParams?.version || (await this.getFallbackRootKeyVersion())
    const accountKey = CreateNewRootKey({
      masterKey: storageValueStore.mk as string,
      dataAuthenticationKey: storageValueStore.ak as string,
      version: version,
      keyParams: accountKeyParams,
    })

    delete storageValueStore.mk
    delete storageValueStore.pw
    delete storageValueStore.ak

    const accountKeyPayload = accountKey.payload

    /** Encrypt account key with passcode */
    const encryptedAccountKey = await this.services.protocolService.encryptSplitSingle({
      usesRootKey: {
        items: [accountKeyPayload],
        key: passcodeKey,
      },
    })
    return {
      accountKey: accountKey,
      wrappedKey: Models.CreateEncryptedLocalStorageContextPayload(encryptedAccountKey),
    }
  }

  /**
   * Helper
   * Web/desktop only
   * Encrypt storage with account key
   */
  async webDesktopHelperEncryptStorage(
    key: SNRootKey,
    decryptedStoragePayload: Models.DecryptedPayloadInterface,
    storageValueStore: Record<string, unknown>,
  ) {
    const wrapped = await this.services.protocolService.encryptSplitSingle({
      usesRootKey: {
        items: [
          decryptedStoragePayload.copy({
            content_type: ContentType.EncryptedStorage,
            content: storageValueStore as unknown as Models.ItemContent,
          }),
        ],
        key: key,
      },
    })

    return Models.CreateEncryptedLocalStorageContextPayload(wrapped)
  }

  /**
   * Mobile
   * On mobile legacy structure is mostly similar to new structure,
   * in that the account key is encrypted with the passcode. But mobile did
   * not have encrypted storage, so we simply need to transfer all existing
   * storage values into new managed structure.
   *
   * In version <= 3.0.16 on mobile, encrypted account keys were stored in the keychain
   * under `encryptedAccountKeys`. In 3.0.17 a migration was introduced that moved this value
   * to storage under key `encrypted_account_keys`. We need to anticipate the keys being in
   * either location.
   *
   * If no account but passcode only, the only thing we stored on mobile
   * previously was keys.offline.pw and keys.offline.timing in the keychain
   * that we compared against for valid decryption.
   * In the new version, we know a passcode is correct if it can decrypt storage.
   * As part of the migration, we’ll need to request the raw passcode from user,
   * compare it against the keychain offline.pw value, and if correct,
   * migrate storage to new structure, and encrypt with passcode key.
   *
   * If account only, take the value in the keychain, and rename the values
   * (i.e mk > masterKey).
   * @access private
   */
  async migrateStorageStructureForMobile() {
    Utils.assert(isMobileDevice(this.services.deviceInterface))

    const keychainValue =
      (await this.services.deviceInterface.getRawKeychainValue()) as unknown as LegacyMobileKeychainStructure

    const wrappedAccountKey = ((await this.services.deviceInterface.getJsonParsedRawStorageValue(
      Services.LegacyKeys1_0_0.MobileWrappedRootKeyKey,
    )) || keychainValue?.encryptedAccountKeys) as Models.EncryptedTransferPayload

    const rawAccountKeyParams = (await this.legacyReader.getAccountKeyParams()) as AnyKeyParamsContent

    const rawPasscodeParams = (await this.services.deviceInterface.getJsonParsedRawStorageValue(
      Services.LegacyKeys1_0_0.MobilePasscodeParamsKey,
    )) as AnyKeyParamsContent

    const firstRunValue = await this.services.deviceInterface.getJsonParsedRawStorageValue(
      Services.NonwrappedStorageKey.MobileFirstRun,
    )

    const rawStructure: Services.StorageValuesObject = {
      [Services.ValueModesKeys.Nonwrapped]: {
        [Services.StorageKey.WrappedRootKey]: wrappedAccountKey,
        /** A 'hash' key may be present from legacy versions that should be deleted */
        [Services.StorageKey.RootKeyWrapperKeyParams]: Utils.omitByCopy(rawPasscodeParams, ['hash' as never]),
        [Services.StorageKey.RootKeyParams]: rawAccountKeyParams,
        [Services.NonwrappedStorageKey.MobileFirstRun]: firstRunValue,
      },
      [Services.ValueModesKeys.Unwrapped]: {},
      [Services.ValueModesKeys.Wrapped]: {} as Models.LocalStorageDecryptedContextualPayload,
    }

    const biometricPrefs = (await this.services.deviceInterface.getJsonParsedRawStorageValue(
      Services.LegacyKeys1_0_0.MobileBiometricsPrefs,
    )) as { enabled: boolean; timing: unknown }

    if (biometricPrefs) {
      rawStructure.nonwrapped[Services.StorageKey.BiometricsState] = biometricPrefs.enabled
      rawStructure.nonwrapped[Services.StorageKey.MobileBiometricsTiming] = biometricPrefs.timing
    }

    const passcodeKeyboardType = await this.services.deviceInterface.getRawStorageValue(
      Services.LegacyKeys1_0_0.MobilePasscodeKeyboardType,
    )

    if (passcodeKeyboardType) {
      rawStructure.nonwrapped[Services.StorageKey.MobilePasscodeKeyboardType] = passcodeKeyboardType
    }

    if (rawPasscodeParams) {
      const passcodeParams = this.services.protocolService.createKeyParams(rawPasscodeParams)
      const getPasscodeKey = async () => {
        let passcodeKey: SNRootKey | undefined

        await this.promptForPasscodeUntilCorrect(async (candidate: string) => {
          passcodeKey = await this.services.protocolService.computeRootKey(candidate, passcodeParams)

          const pwHash = keychainValue?.offline?.pw

          if (pwHash) {
            return passcodeKey.serverPassword === pwHash
          } else {
            /**
             * Fallback decryption if keychain is missing for some reason. If account,
             * validate by attempting to decrypt wrapped account key. Otherwise, validate
             * by attempting to decrypt random item.
             * */
            if (wrappedAccountKey) {
              const decryptedAcctKey = await this.services.protocolService.decryptSplitSingle({
                usesRootKey: {
                  items: [new Models.EncryptedPayload(wrappedAccountKey)],
                  key: passcodeKey,
                },
              })
              return !Models.isErrorDecryptingPayload(decryptedAcctKey)
            } else {
              const item = (
                await this.services.deviceInterface.getAllRawDatabasePayloads(this.services.identifier)
              )[0] as Models.EncryptedTransferPayload

              if (!item) {
                throw Error('Passcode only migration aborting due to missing keychain.offline.pw')
              }

              const decryptedPayload = await this.services.protocolService.decryptSplitSingle({
                usesRootKey: {
                  items: [new Models.EncryptedPayload(item)],
                  key: passcodeKey,
                },
              })
              return !Models.isErrorDecryptingPayload(decryptedPayload)
            }
          }
        })

        return passcodeKey as SNRootKey
      }

      rawStructure.nonwrapped[Services.StorageKey.MobilePasscodeTiming] = keychainValue?.offline?.timing

      if (wrappedAccountKey) {
        /**
         * Account key is encrypted with passcode. Inside, the accountKey is located inside
         * content.accountKeys. We want to unembed these values to main content, rename
         * with proper property names, wrap again, and store in new rawStructure.
         */
        const passcodeKey = await getPasscodeKey()
        const payload = new Models.EncryptedPayload(wrappedAccountKey)
        const unwrappedAccountKey = await this.services.protocolService.decryptSplitSingle<LegacyRootKeyContent>({
          usesRootKey: {
            items: [payload],
            key: passcodeKey,
          },
        })

        if (Models.isErrorDecryptingPayload(unwrappedAccountKey)) {
          return
        }

        const accountKeyContent = unwrappedAccountKey.content.accountKeys as LegacyAccountKeysValue

        const version =
          accountKeyContent.version || rawAccountKeyParams?.version || (await this.getFallbackRootKeyVersion())

        const newAccountKey = unwrappedAccountKey.copy({
          content: Models.FillItemContent<LegacyRootKeyContent>({
            masterKey: accountKeyContent.mk,
            dataAuthenticationKey: accountKeyContent.ak,
            version: version as ProtocolVersion,
            keyParams: rawAccountKeyParams,
            accountKeys: undefined,
          }),
        })

        const newWrappedAccountKey = await this.services.protocolService.encryptSplitSingle({
          usesRootKey: {
            items: [newAccountKey],
            key: passcodeKey,
          },
        })
        rawStructure.nonwrapped[Services.StorageKey.WrappedRootKey] =
          Models.CreateEncryptedLocalStorageContextPayload(newWrappedAccountKey)

        if (accountKeyContent.jwt) {
          /** Move the jwt to raw storage so that it can be migrated in `migrateSessionStorage` */
          void this.services.deviceInterface.setRawStorageValue(LEGACY_SESSION_TOKEN_KEY, accountKeyContent.jwt)
        }
        await this.services.deviceInterface.clearRawKeychainValue()
      } else if (!wrappedAccountKey) {
        /** Passcode only, no account */
        const passcodeKey = await getPasscodeKey()
        const payload = new Models.DecryptedPayload({
          uuid: Utils.UuidGenerator.GenerateUuid(),
          content: Models.FillItemContent(rawStructure.unwrapped),
          content_type: ContentType.EncryptedStorage,
          ...PayloadTimestampDefaults(),
        })

        /** Encrypt new storage.unwrapped structure with passcode */
        const wrapped = await this.services.protocolService.encryptSplitSingle({
          usesRootKey: {
            items: [payload],
            key: passcodeKey,
          },
        })
        rawStructure.wrapped = Models.CreateEncryptedLocalStorageContextPayload(wrapped)

        await this.services.deviceInterface.clearRawKeychainValue()
      }
    } else {
      /** No passcode, potentially account. Migrate keychain property keys. */
      const hasAccount = !Utils.isNullOrUndefined(keychainValue?.mk)
      if (hasAccount) {
        const accountVersion =
          (keychainValue.version as ProtocolVersion) ||
          rawAccountKeyParams?.version ||
          (await this.getFallbackRootKeyVersion())

        const accountKey = CreateNewRootKey({
          masterKey: keychainValue.mk,
          dataAuthenticationKey: keychainValue.ak,
          version: accountVersion,
          keyParams: rawAccountKeyParams,
        })

        await this.services.deviceInterface.setNamespacedKeychainValue(
          accountKey.getKeychainValue(),
          this.services.identifier,
        )

        if (keychainValue.jwt) {
          /** Move the jwt to raw storage so that it can be migrated in `migrateSessionStorage` */
          void this.services.deviceInterface.setRawStorageValue(LEGACY_SESSION_TOKEN_KEY, keychainValue.jwt)
        }
      }
    }

    /** Move encrypted account key into place where it is now expected */
    await this.allPlatformHelperSetStorageStructure(rawStructure)
  }

  /**
   * If we are unable to determine a root key's version, due to missing version
   * parameter from key params due to 001 or 002, we need to fallback to checking
   * any encrypted payload and retrieving its version.
   *
   * If we are unable to garner any meaningful information, we will default to 002.
   *
   * (Previously we attempted to discern version based on presence of keys.ak; if ak,
   * then 003, otherwise 002. However, late versions of 002 also inluded an ak, so this
   * method can't be used. This method also didn't account for 001 versions.)
   */
  private async getFallbackRootKeyVersion() {
    const anyItem = (
      await this.services.deviceInterface.getAllRawDatabasePayloads(this.services.identifier)
    )[0] as Models.EncryptedTransferPayload

    if (!anyItem) {
      return ProtocolVersion.V002
    }

    const payload = new Models.EncryptedPayload(anyItem)
    return payload.version || ProtocolVersion.V002
  }

  /**
   * All platforms
   * Migrate all previously independently stored storage keys into new
   * managed approach.
   */
  private async migrateArbitraryRawStorageToManagedStorageAllPlatforms() {
    const allKeyValues = await this.services.deviceInterface.getAllRawStorageKeyValues()
    const legacyKeys = Utils.objectToValueArray(Services.LegacyKeys1_0_0)

    const tryJsonParse = (value: string) => {
      try {
        return JSON.parse(value)
      } catch (e) {
        return value
      }
    }

    const applicationIdentifier = this.services.identifier

    for (const keyValuePair of allKeyValues) {
      const key = keyValuePair.key
      const value = keyValuePair.value
      const isNameSpacedKey =
        applicationIdentifier && applicationIdentifier.length > 0 && key.startsWith(applicationIdentifier)
      if (legacyKeys.includes(key) || isNameSpacedKey) {
        continue
      }
      if (!Utils.isNullOrUndefined(value)) {
        /**
         * Raw values should always have been json stringified.
         * New values should always be objects/parsed.
         */
        const newValue = tryJsonParse(value as string)
        this.services.storageService.setValue(key, newValue)
      }
    }
  }

  /**
   * All platforms
   * Deletes all StorageKey and LegacyKeys1_0_0 from root raw storage.
   * @access private
   */
  async deleteLegacyStorageValues() {
    const miscKeys = [
      'mk',
      'ak',
      'pw',
      /** v1 unused key */
      'encryptionKey',
      /** v1 unused key */
      'authKey',
      'jwt',
      'ephemeral',
      'cachedThemes',
    ]

    const managedKeys = [
      ...Utils.objectToValueArray(Services.StorageKey),
      ...Utils.objectToValueArray(Services.LegacyKeys1_0_0),
      ...miscKeys,
    ]

    for (const key of managedKeys) {
      await this.services.deviceInterface.removeRawStorageValue(key)
    }
  }

  /**
   * Mobile
   * Migrate mobile preferences
   */
  private async migrateMobilePreferences() {
    const lastExportDate = await this.services.deviceInterface.getJsonParsedRawStorageValue(
      Services.LegacyKeys1_0_0.MobileLastExportDate,
    )
    const doNotWarnUnsupportedEditors = await this.services.deviceInterface.getJsonParsedRawStorageValue(
      Services.LegacyKeys1_0_0.MobileDoNotWarnUnsupportedEditors,
    )
    const legacyOptionsState = (await this.services.deviceInterface.getJsonParsedRawStorageValue(
      Services.LegacyKeys1_0_0.MobileOptionsState,
    )) as Record<string, unknown>

    let migratedOptionsState = {}

    if (legacyOptionsState) {
      const legacySortBy = legacyOptionsState.sortBy
      migratedOptionsState = {
        sortBy:
          legacySortBy === 'updated_at' || legacySortBy === 'client_updated_at'
            ? Models.CollectionSort.UpdatedAt
            : legacySortBy,
        sortReverse: legacyOptionsState.sortReverse ?? false,
        hideNotePreview: legacyOptionsState.hidePreviews ?? false,
        hideDate: legacyOptionsState.hideDates ?? false,
        hideTags: legacyOptionsState.hideTags ?? false,
      }
    }
    const preferences = {
      ...migratedOptionsState,
      lastExportDate: lastExportDate ?? undefined,
      doNotShowAgainUnsupportedEditors: doNotWarnUnsupportedEditors ?? false,
    }
    await this.services.storageService.setValue(Services.StorageKey.MobilePreferences, preferences)
  }

  /**
   * All platforms
   * Migrate previously stored session string token into object
   * On mobile, JWTs were previously stored in storage, inside of the user object,
   * but then custom-migrated to be stored in the keychain. We must account for
   * both scenarios here in case a user did not perform the custom platform migration.
   * On desktop/web, JWT was stored in storage.
   */
  private migrateSessionStorage() {
    const USER_OBJECT_KEY = 'user'
    let currentToken = this.services.storageService.getValue<string | undefined>(LEGACY_SESSION_TOKEN_KEY)
    const user = this.services.storageService.getValue<{ jwt: string; server: string }>(USER_OBJECT_KEY)

    if (!currentToken) {
      /** Try the user object */
      if (user) {
        currentToken = user.jwt
      }
    }

    if (!currentToken) {
      /**
       * If we detect that a user object is present, but the jwt is missing,
       * we'll fill the jwt value with a junk value just so we create a session.
       * When the client attempts to talk to the server, the server will reply
       * with invalid token error, and the client will automatically prompt to reauthenticate.
       */
      const hasAccount = !Utils.isNullOrUndefined(user)
      if (hasAccount) {
        currentToken = 'junk-value'
      } else {
        return
      }
    }

    const session = new JwtSession(currentToken)
    this.services.storageService.setValue(Services.StorageKey.Session, session)

    /** Server has to be migrated separately on mobile */
    if (isEnvironmentMobile(this.services.environment)) {
      if (user && user.server) {
        this.services.storageService.setValue(Services.StorageKey.ServerHost, user.server)
      }
    }
  }

  /**
   * All platforms
   * Create new default items key from root key.
   * Otherwise, when data is loaded, we won't be able to decrypt it
   * without existence of an item key. This will mean that if this migration
   * is run on two different platforms for the same user, they will create
   * two new items keys. Which one they use to decrypt past items and encrypt
   * future items doesn't really matter.
   * @access private
   */
  async createDefaultItemsKeyForAllPlatforms() {
    const rootKey = this.services.protocolService.getRootKey()
    if (rootKey) {
      const rootKeyParams = await this.services.protocolService.getRootKeyParams()
      /** If params are missing a version, it must be 001 */
      const fallbackVersion = ProtocolVersion.V001

      const payload = new Models.DecryptedPayload({
        uuid: Utils.UuidGenerator.GenerateUuid(),
        content_type: ContentType.ItemsKey,
        content: Models.FillItemContentSpecialized<Models.ItemsKeyContentSpecialized, Models.ItemsKeyContent>({
          itemsKey: rootKey.masterKey,
          dataAuthenticationKey: rootKey.dataAuthenticationKey,
          version: rootKeyParams?.version || fallbackVersion,
        }),
        dirty: true,
        dirtyIndex: getIncrementedDirtyIndex(),
        ...PayloadTimestampDefaults(),
      })

      const itemsKey = Models.CreateDecryptedItemFromPayload(payload)

      await this.services.itemManager.emitItemFromPayload(
        itemsKey.payloadRepresentation(),
        Models.PayloadEmitSource.LocalChanged,
      )
    }
  }
}
