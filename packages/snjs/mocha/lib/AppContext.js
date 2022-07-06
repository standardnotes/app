import FakeWebCrypto from './fake_web_crypto.js'
import * as Applications from './Applications.js'
import * as Utils from './Utils.js'
import { createNotePayload } from './Items.js'

UuidGenerator.SetGenerator(new FakeWebCrypto().generateUUID)

const MaximumSyncOptions = {
  checkIntegrity: true,
  awaitAll: true,
}

export class AppContext {
  constructor({ identifier, crypto, email, password, passcode } = {}) {
    if (!identifier) {
      identifier = `${Math.random()}`
    }

    if (!email) {
      email = UuidGenerator.GenerateUuid()
    }

    if (!password) {
      password = UuidGenerator.GenerateUuid()
    }

    if (!passcode) {
      passcode = 'mypasscode'
    }

    this.identifier = identifier
    this.crypto = crypto
    this.email = email
    this.password = password
    this.passcode = passcode
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
      undefined,
      this.crypto || new FakeWebCrypto(),
    )
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

    return this.application.syncService.handleSuccessServerResponse({ payloadsSavedOrSaving: [] }, response)
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

  async launch({ awaitDatabaseLoad = true, receiveChallenge } = { awaitDatabaseLoad: true }) {
    await this.application.prepareForLaunch({
      receiveChallenge: receiveChallenge || this.handleChallenge,
    })
    await this.application.launch(awaitDatabaseLoad)
  }

  async deinit() {
    await Utils.safeDeinit(this.application)
  }

  async sync(options) {
    await this.application.sync.sync(options || { awaitAll: true })
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
    this.application.items.addObserver(ContentType.Any, ({ changed, unerrored }) => {
      callback([...changed, ...unerrored])
    })
  }

  async createSyncedNote(title, text) {
    const payload = createNotePayload(title, text)
    const item = await this.application.items.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
    await this.application.items.setItemDirty(item)
    await this.application.syncService.sync(MaximumSyncOptions)
    const note = this.application.items.findItem(payload.uuid)

    return note
  }

  async deleteItemAndSync(item) {
    await this.application.mutator.deleteItem(item)
  }

  async changeNoteTitle(note, title) {
    return this.application.items.changeNote(note, (mutator) => {
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
}
