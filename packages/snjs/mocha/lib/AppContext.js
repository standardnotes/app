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
  constructor({ identifier, crypto, email, password, passcode, host, syncCallsThresholdPerMinute } = {}) {
    this.identifier = identifier || `${Math.random()}`
    this.crypto = crypto
    this.email = email || UuidGenerator.GenerateUuid()
    this.password = password || UuidGenerator.GenerateUuid()
    this.passcode = passcode || 'mypasscode'
    this.host = host || Defaults.getDefaultHost()
    this.syncCallsThresholdPerMinute = syncCallsThresholdPerMinute
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
      this.syncCallsThresholdPerMinute,
    )

    this.application.dependencies.get(TYPES.Logger).setLevel('error')

    this.disableSubscriptionFetching()
  }

  disableSubscriptionFetching() {
    this.application.subscriptions.fetchAvailableSubscriptions = () => {}
  }

  async launch({ awaitDatabaseLoad = true, receiveChallenge } = { awaitDatabaseLoad: true }) {
    await this.application.prepareForLaunch({
      receiveChallenge: receiveChallenge || this.handleChallenge,
    })

    await this.application.launch(awaitDatabaseLoad)

    await this.awaitUserPrefsSingletonCreation()

    this.application.http.loggingEnabled = true
  }

  async deinit() {
    await Utils.safeDeinit(this.application)
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

  get notifications() {
    return this.application.dependencies.get(TYPES.NotificationService)
  }

  get keyPair() {
    return this.application.dependencies.get(TYPES.GetKeyPairs).execute().getValue().encryption
  }

  get signingKeyPair() {
    return this.application.dependencies.get(TYPES.GetKeyPairs).execute().getValue().signing
  }

  get publicKey() {
    return this.keyPair.publicKey
  }

  get signingPublicKey() {
    return this.signingKeyPair.publicKey
  }

  get privateKey() {
    return this.keyPair.privateKey
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

    const accountPassword = this.password

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

  async addPasscode(passcode) {
    this.passcode = passcode

    await this.application.addPasscode(passcode)
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

  awaitNextSyncError() {
    return new Promise((resolve) => {
      const removeObserver = this.application.sync.addEventObserver((event, data) => {
        if (event === SyncEvent.SyncError) {
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

  async restoreSession(latestPassword) {
    const promise = this.resolveWhenSessionIsReauthenticated()
    this.password = latestPassword
    await this.sync()
    await promise
    await this.sync()
  }

  resolveWhenSessionIsReauthenticated() {
    return new Promise((resolve) => {
      const removeObserver = this.application.sessions.addEventObserver((event, data) => {
        if (event === SessionEvent.Restored) {
          removeObserver()
          resolve()
        }
      })
    })
  }

  resolveWithUploadedPayloads() {
    return new Promise((resolve) => {
      const removeObserver = this.application.sync.addEventObserver((event, data) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          removeObserver()
          resolve(data.uploadedPayloads)
        }
      })
    })
  }

  resolveWithSyncRetrievedPayloads() {
    return new Promise((resolve) => {
      const removeObserver = this.application.sync.addEventObserver((event, data) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          removeObserver()
          resolve(data.retrievedPayloads)
        }
      })
    })
  }

  resolveWithConflicts() {
    return new Promise((resolve) => {
      const removeObserver = this.application.sync.addEventObserver((event, response) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          removeObserver()
          resolve(response.rawConflictObjects)
        }
      })
    })
  }

  resolveWhenSavedSyncPayloadsIncludesItemUuid(uuid) {
    return new Promise((resolve) => {
      const removeObserver = this.application.sync.addEventObserver((event, response) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          const savedPayload = response.savedPayloads.find((payload) => payload.uuid === uuid)
          if (savedPayload) {
            removeObserver()
            resolve()
          }
        }
      })
    })
  }

  resolveWhenSavedSyncPayloadsIncludesItemThatIsDuplicatedOf(uuid) {
    return new Promise((resolve) => {
      const removeObserver = this.application.sync.addEventObserver((event, response) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          const savedPayload = response.savedPayloads.find((payload) => payload.duplicate_of === uuid)
          if (savedPayload) {
            removeObserver()
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
    if (!object[functionName]) {
      throw new Error(`Object does not have function ${functionName}`)
    }

    const originalFunction = object[functionName].bind(object)

    return new Promise((resolve) => {
      sinon.stub(object, functionName).callsFake(async (params) => {
        object[functionName].restore()
        const result = await originalFunction(params)
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

  async changeEmail(newEmail) {
    await this.application.changeEmail(newEmail, this.password, this.passcode)

    this.email = newEmail
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

  sleep(seconds, reason = undefined) {
    return Utils.sleep(seconds, reason)
  }

  anticipateConsoleError(message, _reason) {
    console.warn('Anticipating a console error with message:', message)
  }

  awaitPromiseOrThrow(promise, maxWait = 2.0, reason = 'Awaiting promise timed out; No description provided') {
    return Utils.awaitPromiseOrThrow(promise, maxWait, reason)
  }

  awaitPromiseOrDoNothing(promise, maxWait = 2.0, reason = 'Awaiting promise timed out; No description provided') {
    return Utils.awaitPromiseOrDoNothing(promise, maxWait, reason)
  }

  async activatePaidSubscriptionForUser(options = {}) {
    const dateInAnHour = new Date()
    dateInAnHour.setHours(dateInAnHour.getHours() + 1)

    options.expiresAt = options.expiresAt || dateInAnHour
    options.subscriptionPlanName = options.subscriptionPlanName || 'PRO_PLAN'
    options.cancelPreviousSubscription = options.cancelPreviousSubscription || false

    const nextSubscriptionId = GlobalSubscriptionIdCounter++

    let uploadBytesLimit = -1
    switch (options.subscriptionPlanName) {
      case 'PLUS_PLAN':
        uploadBytesLimit = 104_857_600
        break
      case 'PRO_PLAN':
        uploadBytesLimit = 107_374_182_400
        break
    }

    try {
      if (options.cancelPreviousSubscription) {
        await Events.publishMockedEvent('SUBSCRIPTION_CANCELLED', {
          userEmail: this.email,
          subscriptionId: (nextSubscriptionId - 1),
          subscriptionName: options.subscriptionPlanName,
          subscriptionCreatedAt: 1,
          subscriptionUpdatedAt: 1,
          lastPayedAt: 1,
          subscriptionEndsAt: (new Date()).getTime() * 1_000,
          timestamp: (new Date()).getTime() * 1_000,
          offline: false,
          replaced: true,
          userExistingSubscriptionsCount: 1,
          billingFrequency: 12,
          payAmount: 59.0,
        })
      }

      await Events.publishMockedEvent('SUBSCRIPTION_PURCHASED', {
        userEmail: this.email,
        subscriptionId: nextSubscriptionId,
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

      await this.sleep(2, 'Waiting for premium features to be activated')
    } catch (error) {
      console.warn(
        `Mock events service not available. You are probably running a test suite for home server: ${error.message}`,
      )

      try {
        await HomeServer.activatePremiumFeatures(this.email, nextSubscriptionId, options.subscriptionPlanName, options.expiresAt, uploadBytesLimit, options.cancelPreviousSubscription)

        await this.sleep(1, 'Waiting for premium features to be activated')
      } catch (error) {
        console.warn(
          `Home server not available. You are probably running a test suite for self hosted setup: ${error.message}`,
        )
      }
    }
  }
}
