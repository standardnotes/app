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
    const syncService = this.application.syncService
    const payloadManager = this.application.payloadManager

    syncService.getServiceName = () => {
      return `${this.identifier}—SyncService`
    }
    payloadManager.getServiceName = () => {
      return `${this.identifier}-PayloadManager`
    }

    syncService.loggingEnabled = true
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

  get vaults() {
    return this.application.vaultService
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
    return this.application.payloadManager
  }

  get encryption() {
    return this.application.encryptionService
  }

  get contacts() {
    return this.application.contactService
  }

  get sharedVaults() {
    return this.application.sharedVaultService
  }

  get files() {
    return this.application.fileService
  }

  get keys() {
    return this.application.keySystemKeyManager
  }

  get asymmetric() {
    return this.application.asymmetricMessageService
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
    this.application.syncService.emitOutOfSyncRemotePayloads = () => {
      console.warn('Integrity self-healing is disabled for this test')
    }
  }

  disableKeyRecovery() {
    this.application.keyRecoveryService.beginKeyRecovery = () => {
      console.warn('Key recovery is disabled for this test')
    }
  }

  handleChallenge = (challenge) => {
    if (this.ignoringChallenges) {
      this.application.challengeService.cancelChallenge(challenge)

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

    return this.application.syncService.handleSuccessServerResponse(
      { payloadsSavedOrSaving: [], options: {} },
      response,
    )
  }

  resolveWhenKeyRecovered(uuid) {
    return new Promise((resolve) => {
      this.application.keyRecoveryService.addEventObserver((_eventName, keys) => {
        if (Uuids(keys).includes(uuid)) {
          resolve()
        }
      })
    })
  }

  resolveWhenSharedVaultUserKeysResolved() {
    return new Promise((resolve) => {
      this.application.vaultService.collaboration.addEventObserver((eventName) => {
        if (eventName === SharedVaultServiceEvent.SharedVaultStatusChanged) {
          resolve()
        }
      })
    })
  }

  async awaitSignInEvent() {
    return new Promise((resolve) => {
      this.application.userService.addEventObserver((eventName) => {
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
      const removeObserver = this.application.syncService.addEventObserver((event) => {
        if (event === SyncEvent.SyncCompletedWithAllItemsUploadedAndDownloaded) {
          removeObserver()
          resolve()
        }
      })
    })
  }

  awaitNextSyncEvent(eventName) {
    return new Promise((resolve) => {
      const removeObserver = this.application.syncService.addEventObserver((event, data) => {
        if (event === eventName) {
          removeObserver()
          resolve(data)
        }
      })
    })
  }

  awaitNextSyncSharedVaultFromScratchEvent() {
    return new Promise((resolve) => {
      const removeObserver = this.application.syncService.addEventObserver((event, data) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted && data?.options?.sharedVaultUuids) {
          removeObserver()
          resolve(data)
        }
      })
    })
  }

  resolveWithUploadedPayloads() {
    return new Promise((resolve) => {
      this.application.syncService.addEventObserver((event, data) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          resolve(data.uploadedPayloads)
        }
      })
    })
  }

  resolveWithConflicts() {
    return new Promise((resolve) => {
      this.application.syncService.addEventObserver((event, response) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          resolve(response.rawConflictObjects)
        }
      })
    })
  }

  resolveWhenSavedSyncPayloadsIncludesItemUuid(uuid) {
    return new Promise((resolve) => {
      this.application.syncService.addEventObserver((event, response) => {
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
      this.application.syncService.addEventObserver((event, response) => {
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

  resolveWhenAsymmetricMessageProcessingCompletes() {
    return new Promise((resolve) => {
      const objectToSpy = this.asymmetric
      sinon.stub(objectToSpy, 'handleRemoteReceivedAsymmetricMessages').callsFake(async (messages) => {
        objectToSpy.handleRemoteReceivedAsymmetricMessages.restore()
        const result = await objectToSpy.handleRemoteReceivedAsymmetricMessages(messages)
        resolve()
        return result
      })
    })
  }

  resolveWhenUserMessagesProcessingCompletes() {
    return new Promise((resolve) => {
      const objectToSpy = this.application.userEventService
      sinon.stub(objectToSpy, 'handleReceivedUserEvents').callsFake(async (params) => {
        objectToSpy.handleReceivedUserEvents.restore()
        const result = await objectToSpy.handleReceivedUserEvents(params)
        resolve()
        return result
      })
    })
  }

  resolveWhenSharedVaultServiceSendsContactShareMessage() {
    return new Promise((resolve) => {
      const objectToSpy = this.sharedVaults
      sinon.stub(objectToSpy, 'shareContactWithUserAdministeredSharedVaults').callsFake(async (contact) => {
        objectToSpy.shareContactWithUserAdministeredSharedVaults.restore()
        const result = await objectToSpy.shareContactWithUserAdministeredSharedVaults(contact)
        resolve()
        return result
      })
    })
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
    const preferences = this.application.preferencesService.preferences
    if (preferences) {
      return
    }

    let didCompleteRelevantSync = false
    return new Promise((resolve) => {
      this.application.syncService.addEventObserver((eventName, data) => {
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
      this.application.preferencesService.addEventObserver((eventName) => {
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
    return this.application.payloadManager.findPayload(uuid)
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
    this.application.keyRecoveryService.performServerSignIn = () => {
      console.warn('application.keyRecoveryService.performServerSignIn has been stubbed with an empty implementation')
    }
  }

  preventKeyRecoveryOfKeys(ids) {
    const originalImpl = this.application.keyRecoveryService.handleUndecryptableItemsKeys

    this.application.keyRecoveryService.handleUndecryptableItemsKeys = function (keys) {
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
    await this.application.syncService.sync(MaximumSyncOptions)
    const note = this.application.items.findItem(payload.uuid)

    return note
  }

  lockSyncing() {
    this.application.syncService.lockSyncing()
  }

  unlockSyncing() {
    this.application.syncService.unlockSyncing()
  }

  async deleteItemAndSync(item) {
    await this.application.mutator.deleteItem(item)
    await this.sync()
  }

  async changeNoteTitle(note, title) {
    return this.application.mutator.changeNote(note, (mutator) => {
      mutator.title = title
    })
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

  async activatePaidSubscriptionForUser() {
    await Events.publishMockedEvent('SUBSCRIPTION_PURCHASED', {
      userEmail: this.email,
      subscriptionId: GlobalSubscriptionIdCounter++,
      subscriptionName: 'PRO_PLAN',
      subscriptionExpiresAt: (new Date().getTime() + 3_600_000) * 1_000,
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

    await HomeServer.activatePremiumFeatures(this.email)

    await Utils.sleep(2)
  }
}
