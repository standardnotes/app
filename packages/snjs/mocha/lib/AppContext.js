import FakeWebCrypto from './fake_web_crypto.js'
import * as Applications from './Applications.js'
import * as Utils from './Utils.js'
import * as Defaults from './Defaults.js'
import * as Events from './Events.js'
import * as HomeServer from './HomeServer.js'
import { createNotePayload } from './Items.js'

UuidGenerator.SetGenerator(new FakeWebCrypto().generateUUID)

const MaximumSyncOptions = {
  checkIntegrity: true,
  awaitAll: true,
}

let GlobalSubscriptionIdCounter = 1001

export class AppContext {
  constructor({ identifier, crypto, email, password, passcode, host } = {}) {
    this.identifier = identifier || `${Math.random()}`
    this.crypto = crypto
    this.email = email || UuidGenerator.GenerateUuid()
    this.password = password || UuidGenerator.GenerateUuid()
    this.passcode = passcode || 'mypasscode'
    this.host = host || Defaults.getDefaultHost()
  }

  enableLogging() {
    const payloadManager = this.application.payloads

    this.application.sync.getServiceName = () => {
      return `${this.identifier}—SyncService`
    }
    payloadManager.getServiceName = () => {
      return `${this.identifier}-PayloadManager`
    }

    this.application.sync.loggingEnabled = true
    payloadManager.loggingEnabled = true
  }

  async initialize() {
    this.application = await Applications.createApplication(
      this.identifier,
      undefined,
      undefined,
      this.host,
      this.crypto || new FakeWebCrypto(),
    )
  }

  get sessions() {
    return this.application.sessions
  }

  get items() {
    return this.application.items
  }

  get mutator() {
    return this.application.mutator
  }

  get payloads() {
    return this.application.payloads
  }

  get encryption() {
    return this.application.encryption
  }

  get keyRecovery() {
    return this.application.dependencies.get(TYPES.KeyRecoveryService)
  }

  get singletons() {
    return this.application.dependencies.get(TYPES.SingletonManager)
  }

  get history() {
    return this.application.dependencies.get(TYPES.HistoryManager)
  }

  get subscriptions() {
    return this.application.dependencies.get(TYPES.SubscriptionManager)
  }

  get contacts() {
    return this.application.contacts
  }

  get sharedVaults() {
    return this.application.sharedVaults
  }

  get vaults() {
    return this.application.vaults
  }

  get vaultLocks() {
    return this.application.vaultLocks
  }

  get vaultUsers() {
    return this.application.vaultUsers
  }

  get vaultInvites() {
    return this.application.vaultInvites
  }

  get files() {
    return this.application.files
  }

  get keys() {
    return this.application.dependencies.get(TYPES.KeySystemKeyManager)
  }

  get operators() {
    return this.application.dependencies.get(TYPES.EncryptionOperators)
  }

  get asymmetric() {
    return this.application.asymmetric
  }

  get publicKey() {
    return this.sessions.getPublicKey()
  }

  get signingPublicKey() {
    return this.sessions.getSigningPublicKey()
  }

  get privateKey() {
    return this.encryption.getKeyPair().privateKey
  }

  ignoreChallenges() {
    this.ignoringChallenges = true
  }

  resumeChallenges() {
    this.ignoringChallenges = false
  }

  disableIntegrityAutoHeal() {
    this.application.sync.emitOutOfSyncRemotePayloads = () => {
      console.warn('Integrity self-healing is disabled for this test')
    }
  }

  disableKeyRecovery() {
    this.keyRecovery.beginKeyRecovery = () => {
      console.warn('Key recovery is disabled for this test')
    }
  }

  handleChallenge = (challenge) => {
    if (this.ignoringChallenges) {
      this.application.challenges.cancelChallenge(challenge)

      return
    }

    const responses = []

    const accountPassword = this.passwordToUseForAccountPasswordChallenge || this.password

    for (const prompt of challenge.prompts) {
      if (prompt.validation === ChallengeValidation.LocalPasscode) {
        responses.push(CreateChallengeValue(prompt, this.passcode))
      } else if (prompt.validation === ChallengeValidation.AccountPassword) {
        responses.push(CreateChallengeValue(prompt, accountPassword))
      } else if (prompt.validation === ChallengeValidation.ProtectionSessionDuration) {
        responses.push(CreateChallengeValue(prompt, 0))
      } else if (prompt.placeholder === 'Email') {
        responses.push(CreateChallengeValue(prompt, this.email))
      } else if (prompt.placeholder === 'Password') {
        responses.push(CreateChallengeValue(prompt, accountPassword))
      } else if (challenge.heading.includes('account password')) {
        responses.push(CreateChallengeValue(prompt, accountPassword))
      } else {
        console.log('Unhandled challenge', challenge)
        throw Error(`Unhandled custom challenge in Factory.createAppContext`)
      }
    }

    this.application.submitValuesForChallenge(challenge, responses)
  }

  signIn() {
    const strict = false
    const ephemeral = false
    const mergeLocal = true
    const awaitSync = true
    return this.application.signIn(this.email, this.password, strict, ephemeral, mergeLocal, awaitSync)
  }

  register() {
    return this.application.register(this.email, this.password)
  }

  receiveServerResponse({ retrievedItems }) {
    const response = new ServerSyncResponse({
      data: {
        retrieved_items: retrievedItems,
      },
    })

    return this.application.sync.handleSuccessServerResponse({ payloadsSavedOrSaving: [], options: {} }, response)
  }

  resolveWhenKeyRecovered(uuid) {
    return new Promise((resolve) => {
      this.keyRecovery.addEventObserver((_eventName, keys) => {
        if (Uuids(keys).includes(uuid)) {
          resolve()
        }
      })
    })
  }

  async awaitSignInEvent() {
    return new Promise((resolve) => {
      this.application.user.addEventObserver((eventName) => {
        if (eventName === AccountEvent.SignedInOrRegistered) {
          resolve()
        }
      })
    })
  }

  async restart() {
    const id = this.application.identifier
    await Utils.safeDeinit(this.application)
    const newApplication = await Applications.createAndInitializeApplication(id)
    this.application = newApplication
    return newApplication
  }

  async signout() {
    await this.application.user.signOut()
    await this.initialize()
    await this.launch()
    return this.application
  }

  syncWithIntegrityCheck() {
    return this.application.sync.sync({ checkIntegrity: true, awaitAll: true })
  }

  awaitNextSucessfulSync() {
    return new Promise((resolve) => {
      const removeObserver = this.application.sync.addEventObserver((event, data) => {
        if (event === SyncEvent.SyncCompletedWithAllItemsUploadedAndDownloaded) {
          removeObserver()
          resolve(data)
        }
      })
    })
  }

  awaitNextSyncEvent(eventName) {
    return new Promise((resolve) => {
      const removeObserver = this.application.sync.addEventObserver((event, data) => {
        if (event === eventName) {
          removeObserver()
          resolve(data)
        }
      })
    })
  }

  awaitNextSyncSharedVaultFromScratchEvent() {
    return new Promise((resolve) => {
      const removeObserver = this.application.sync.addEventObserver((event, data) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted && data?.options?.sharedVaultUuids) {
          removeObserver()
          resolve(data)
        }
      })
    })
  }

  resolveWithUploadedPayloads() {
    return new Promise((resolve) => {
      this.application.sync.addEventObserver((event, data) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          resolve(data.uploadedPayloads)
        }
      })
    })
  }

  resolveWithSyncRetrievedPayloads() {
    return new Promise((resolve) => {
      this.application.sync.addEventObserver((event, data) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          resolve(data.retrievedPayloads)
        }
      })
    })
  }

  resolveWithConflicts() {
    return new Promise((resolve) => {
      this.application.sync.addEventObserver((event, response) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          resolve(response.rawConflictObjects)
        }
      })
    })
  }

  resolveWhenSavedSyncPayloadsIncludesItemUuid(uuid) {
    return new Promise((resolve) => {
      this.application.sync.addEventObserver((event, response) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          const savedPayload = response.savedPayloads.find((payload) => payload.uuid === uuid)
          if (savedPayload) {
            resolve()
          }
        }
      })
    })
  }

  resolveWhenSavedSyncPayloadsIncludesItemThatIsDuplicatedOf(uuid) {
    return new Promise((resolve) => {
      this.application.sync.addEventObserver((event, response) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          const savedPayload = response.savedPayloads.find((payload) => payload.duplicate_of === uuid)
          if (savedPayload) {
            resolve()
          }
        }
      })
    })
  }

  resolveWhenItemCompletesAddingToVault(targetItem) {
    return new Promise((resolve) => {
      const objectToSpy = this.vaults
      sinon.stub(objectToSpy, 'moveItemToVault').callsFake(async (vault, item) => {
        objectToSpy.moveItemToVault.restore()
        const result = await objectToSpy.moveItemToVault(vault, item)
        if (!targetItem || item.uuid === targetItem.uuid) {
          resolve()
        }
        return result
      })
    })
  }

  resolveWhenItemCompletesRemovingFromVault(targetItem) {
    return new Promise((resolve) => {
      const objectToSpy = this.vaults
      sinon.stub(objectToSpy, 'removeItemFromVault').callsFake(async (item) => {
        objectToSpy.removeItemFromVault.restore()
        const result = await objectToSpy.removeItemFromVault(item)
        if (item.uuid === targetItem.uuid) {
          resolve()
        }
        return result
      })
    })
  }

  resolveWhenAsyncFunctionCompletes(object, functionName) {
    return new Promise((resolve) => {
      sinon.stub(object, functionName).callsFake(async (params) => {
        object[functionName].restore()
        const result = await object[functionName](params)
        resolve()
        return result
      })
    })
  }

  spyOnFunctionResult(object, functionName) {
    const originalFunction = object[functionName].bind(object)
    return new Promise((resolve, reject) => {
      try {
        sinon.stub(object, functionName).callsFake(async (params) => {
          const result = await originalFunction(params)
          object[functionName].restore()
          setTimeout(() => {
            resolve(result)
          }, 0)
          return result
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  resolveWhenAsymmetricMessageProcessingCompletes() {
    return this.resolveWhenAsyncFunctionCompletes(this.asymmetric, 'handleRemoteReceivedAsymmetricMessages')
  }

  resolveWhenUserMessagesProcessingCompletes() {
    const objectToSpy = this.application.dependencies.get(TYPES.UserEventService)
    return this.resolveWhenAsyncFunctionCompletes(objectToSpy, 'handleReceivedUserEvents')
  }

  resolveWhenAllInboundAsymmetricMessagesAreDeleted() {
    const objectToSpy = this.application.dependencies.get(TYPES.AsymmetricMessageServer)
    return this.resolveWhenAsyncFunctionCompletes(objectToSpy, 'deleteAllInboundMessages')
  }

  resolveWhenAllInboundSharedVaultInvitesAreDeleted() {
    const objectToSpy = this.application.vaultInvites.invitesServer
    return this.resolveWhenAsyncFunctionCompletes(objectToSpy, 'deleteAllInboundInvites')
  }

  resolveWhenSharedVaultServiceSendsContactShareMessage() {
    const objectToSpy = this.sharedVaults
    return this.resolveWhenAsyncFunctionCompletes(objectToSpy, 'shareContactWithVaults')
  }

  resolveWhenSharedVaultKeyRotationInvitesGetSent(targetVault) {
    return new Promise((resolve) => {
      const objectToSpy = this.sharedVaults
      sinon.stub(objectToSpy, 'handleVaultRootKeyRotatedEvent').callsFake(async (vault) => {
        objectToSpy.handleVaultRootKeyRotatedEvent.restore()
        const result = await objectToSpy.handleVaultRootKeyRotatedEvent(vault)
        if (vault.systemIdentifier === targetVault.systemIdentifier) {
          resolve()
        }
        return result
      })
    })
  }

  resolveWhenSharedVaultChangeInvitesAreSent(sharedVaultUuid) {
    return new Promise((resolve) => {
      const objectToSpy = this.sharedVaults
      sinon.stub(objectToSpy, 'handleVaultRootKeyRotatedEvent').callsFake(async (vault) => {
        objectToSpy.handleVaultRootKeyRotatedEvent.restore()
        const result = await objectToSpy.handleVaultRootKeyRotatedEvent(vault)
        if (vault.sharing.sharedVaultUuid === sharedVaultUuid) {
          resolve()
        }
        return result
      })
    })
  }

  awaitUserPrefsSingletonCreation() {
    const preferences = this.application.preferences.preferences
    if (preferences) {
      return
    }

    let didCompleteRelevantSync = false
    return new Promise((resolve) => {
      this.application.sync.addEventObserver((eventName, data) => {
        if (!didCompleteRelevantSync) {
          if (data?.savedPayloads) {
            const matching = data.savedPayloads.find((p) => {
              return p.content_type === ContentType.TYPES.UserPrefs
            })
            if (matching) {
              didCompleteRelevantSync = true
              resolve()
            }
          }
        }
      })
    })
  }

  awaitUserPrefsSingletonResolution() {
    return new Promise((resolve) => {
      this.application.preferences.addEventObserver((eventName) => {
        if (eventName === PreferencesServiceEvent.PreferencesChanged) {
          resolve()
        }
      })
    })
  }

  async launch({ awaitDatabaseLoad = true, receiveChallenge } = { awaitDatabaseLoad: true }) {
    await this.application.prepareForLaunch({
      receiveChallenge: receiveChallenge || this.handleChallenge,
    })
    await this.application.launch(awaitDatabaseLoad)
    await this.awaitUserPrefsSingletonCreation()
  }

  async deinit() {
    await Utils.safeDeinit(this.application)
  }

  async sync(options) {
    await this.application.sync.sync(options || { awaitAll: true })
  }

  async clearSyncPositionTokens() {
    await this.application.sync.clearSyncPositionTokens()
  }

  async maximumSync() {
    await this.sync(MaximumSyncOptions)
  }

  async changePassword(newPassword) {
    await this.application.changePassword(this.password, newPassword)

    this.password = newPassword
  }

  findItem(uuid) {
    return this.application.items.findItem(uuid)
  }

  findPayload(uuid) {
    return this.application.payloads.findPayload(uuid)
  }

  get itemsKeys() {
    return this.application.items.getDisplayableItemsKeys()
  }

  disableSyncingOfItems(uuids) {
    const originalImpl = this.application.items.getDirtyItems

    this.application.items.getDirtyItems = function () {
      const result = originalImpl.apply(this)

      return result.filter((i) => !uuids.includes(i.uuid))
    }
  }

  disableKeyRecoveryServerSignIn() {
    this.keyRecovery.performServerSignIn = () => {
      console.warn('application.keyRecovery.performServerSignIn has been stubbed with an empty implementation')
    }
  }

  preventKeyRecoveryOfKeys(ids) {
    const originalImpl = this.keyRecovery.handleUndecryptableItemsKeys

    this.keyRecovery.handleUndecryptableItemsKeys = function (keys) {
      const filtered = keys.filter((k) => !ids.includes(k.uuid))

      originalImpl.apply(this, [filtered])
    }
  }

  respondToAccountPasswordChallengeWith(password) {
    this.passwordToUseForAccountPasswordChallenge = password
  }

  spyOnChangedItems(callback) {
    this.application.items.addObserver(ContentType.TYPES.Any, ({ changed, unerrored }) => {
      callback([...changed, ...unerrored])
    })
  }

  async createSyncedNote(title = 'foo', text = 'bar') {
    const payload = createNotePayload(title, text)
    const item = await this.application.mutator.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
    await this.application.mutator.setItemDirty(item)
    await this.application.sync.sync(MaximumSyncOptions)
    const note = this.application.items.findItem(payload.uuid)

    return note
  }

  lockSyncing() {
    this.application.sync.lockSyncing()
  }

  unlockSyncing() {
    this.application.sync.unlockSyncing()
  }

  async deleteItemAndSync(item) {
    await this.application.mutator.deleteItem(item)
    await this.sync()
  }

  async changeNoteTitle(note, title) {
    await this.application.mutator.changeNote(note, (mutator) => {
      mutator.title = title
    })

    return this.findItem(note.uuid)
  }

  async changeNoteTitleAndSync(note, title) {
    await this.changeNoteTitle(note, title)
    await this.sync()

    return this.findItem(note.uuid)
  }

  findNoteByTitle(title) {
    return this.application.items.getDisplayableNotes().find((note) => note.title === title)
  }

  get noteCount() {
    return this.application.items.getDisplayableNotes().length
  }

  get notes() {
    return this.application.items.getDisplayableNotes()
  }

  async createConflictedNotes(otherContext) {
    const note = await this.createSyncedNote()

    await otherContext.sync()

    await this.changeNoteTitleAndSync(note, 'title-1')

    await otherContext.changeNoteTitleAndSync(note, 'title-2')

    await this.sync()

    return {
      original: note,
      conflict: this.findNoteByTitle('title-2'),
    }
  }

  findDuplicateNote(duplicateOfUuid) {
    const items = this.items.getDisplayableNotes()
    return items.find((note) => note.duplicateOf === duplicateOfUuid)
  }

  get userUuid() {
    return this.application.sessions.user.uuid
  }

  sleep(seconds) {
    return Utils.sleep(seconds)
  }

  anticipateConsoleError(message, _reason) {
    console.warn('Anticipating a console error with message:', message)
  }

  async activatePaidSubscriptionForUser(options = {}) {
    const dateInAnHour = new Date()
    dateInAnHour.setHours(dateInAnHour.getHours() + 1)

    options.expiresAt = options.expiresAt || dateInAnHour
    options.subscriptionPlanName = options.subscriptionPlanName || 'PRO_PLAN'

    try {
      await Events.publishMockedEvent('SUBSCRIPTION_PURCHASED', {
        userEmail: this.email,
        subscriptionId: GlobalSubscriptionIdCounter++,
        subscriptionName: options.subscriptionPlanName,
        subscriptionExpiresAt: options.expiresAt.getTime() * 1_000,
        timestamp: Date.now(),
        offline: false,
        discountCode: null,
        limitedDiscountPurchased: false,
        newSubscriber: true,
        totalActiveSubscriptionsCount: 1,
        userRegisteredAt: 1,
        billingFrequency: 12,
        payAmount: 59.0,
      })

      await Utils.sleep(2)
    } catch (error) {
      console.warn(
        `Mock events service not available. You are probalby running a test suite for home server: ${error.message}`,
      )
    }

    try {
      await HomeServer.activatePremiumFeatures(this.email, options.subscriptionPlanName, options.expiresAt)

      await Utils.sleep(1, 'Waiting for premium features to be activated')
    } catch (error) {
      console.warn(
        `Home server not available. You are probalby running a test suite for self hosted setup: ${error.message}`,
      )
    }
  }
}
