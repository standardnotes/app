
import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('protections', function () {
  this.timeout(Factory.TenSecondTimeout)

  let application

  beforeEach(function () {
    localStorage.clear()
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  it('prompts for password when accessing protected note', async function () {
    let challengePrompts = 0

    application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
    const password = UuidGenerator.GenerateUuid()
    await application.prepareForLaunch({
      receiveChallenge: (challenge) => {
        challengePrompts += 1
        expect(challenge.prompts.find((prompt) => prompt.validation === ChallengeValidation.AccountPassword)).to.be.ok
        const values = challenge.prompts.map(
          (prompt) =>
            CreateChallengeValue(
              prompt,
              prompt.validation === ChallengeValidation.AccountPassword
                ? password
                : UnprotectedAccessSecondsDuration.OneMinute,
            ),
        )

        application.submitValuesForChallenge(challenge, values)
      },
    })
    await application.launch(true)
    await Factory.registerUserToApplication({
      application: application,
      email: UuidGenerator.GenerateUuid(),
      password,
    })

    let note = await Factory.createMappedNote(application)
    note = await application.protections.protectNote(note)

    expect(await application.authorizeNoteAccess(note)).to.be.true
    expect(challengePrompts).to.equal(1)
  })

  it('sets `note.protected` to true', async function () {
    application = await Factory.createInitAppWithFakeCrypto()
    let note = await Factory.createMappedNote(application)
    note = await application.protections.protectNote(note)
    expect(note.protected).to.be.true
  })

  it('prompts for passcode when accessing protected note', async function () {
    const passcode = 'passcode'
    let challengePrompts = 0

    application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
    await application.prepareForLaunch({
      receiveChallenge: (challenge) => {
        challengePrompts += 1
        expect(challenge.prompts.find((prompt) => prompt.validation === ChallengeValidation.LocalPasscode)).to.be.ok
        const values = challenge.prompts.map(
          (prompt) =>
            CreateChallengeValue(
              prompt,
              prompt.validation === ChallengeValidation.LocalPasscode
                ? passcode
                : UnprotectedAccessSecondsDuration.OneMinute,
            ),
        )

        application.submitValuesForChallenge(challenge, values)
      },
    })
    await application.launch(true)

    await application.addPasscode(passcode)
    let note = await Factory.createMappedNote(application)
    note = await application.protections.protectNote(note)

    expect(await application.authorizeNoteAccess(note)).to.be.true
    expect(challengePrompts).to.equal(1)
  })

  it('prompts for passcode when unprotecting a note', async function () {
    const passcode = 'passcode'
    let challengePrompts = 0

    application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
    await application.prepareForLaunch({
      receiveChallenge: (challenge) => {
        challengePrompts += 1
        expect(challenge.prompts.find((prompt) => prompt.validation === ChallengeValidation.LocalPasscode)).to.be.ok
        const values = challenge.prompts.map(
          (prompt) =>
            CreateChallengeValue(
              prompt,
              prompt.validation === ChallengeValidation.LocalPasscode
                ? passcode
                : UnprotectedAccessSecondsDuration.OneMinute,
            ),
        )

        application.submitValuesForChallenge(challenge, values)
      },
    })
    await application.launch(true)

    await application.addPasscode(passcode)
    let note = await Factory.createMappedNote(application)
    const uuid = note.uuid
    note = await application.protections.protectNote(note)
    note = await application.protections.unprotectNote(note)
    expect(note.uuid).to.equal(uuid)
    expect(note.protected).to.equal(false)
    expect(challengePrompts).to.equal(1)
  })

  it('does not unprotect note if challenge is canceled', async function () {
    const passcode = 'passcode'
    let challengePrompts = 0

    application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
    await application.prepareForLaunch({
      receiveChallenge: (challenge) => {
        challengePrompts++
        application.cancelChallenge(challenge)
      },
    })
    await application.launch(true)

    await application.addPasscode(passcode)
    let note = await Factory.createMappedNote(application)
    note = await application.protections.protectNote(note)
    const result = await application.protections.unprotectNote(note)
    expect(result).to.be.undefined
    expect(challengePrompts).to.equal(1)
  })

  it('does not prompt for passcode again after setting a remember duration', async function () {
    const passcode = 'passcode'

    let challengePrompts = 0
    application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
    await application.prepareForLaunch({
      receiveChallenge: (challenge) => {
        challengePrompts += 1
        expect(challenge.prompts.find((prompt) => prompt.validation === ChallengeValidation.LocalPasscode)).to.be.ok
        const values = challenge.prompts.map(
          (prompt) =>
            CreateChallengeValue(
              prompt,
              prompt.validation === ChallengeValidation.LocalPasscode
                ? passcode
                : UnprotectedAccessSecondsDuration.OneHour,
            ),
        )

        application.submitValuesForChallenge(challenge, values)
      },
    })
    await application.launch(true)

    await application.addPasscode(passcode)
    let note = await Factory.createMappedNote(application)
    note = await application.protections.protectNote(note)

    expect(await application.authorizeNoteAccess(note)).to.be.true
    expect(await application.authorizeNoteAccess(note)).to.be.true
    expect(challengePrompts).to.equal(1)
  })

  it('prompts for password when adding a passcode', async function () {
    application = Factory.createApplicationWithFakeCrypto(Factory.randomString())
    const password = UuidGenerator.GenerateUuid()
    const passcode = 'passcode'
    let didPromptForPassword = false

    await application.prepareForLaunch({
      receiveChallenge: (challenge) => {
        let values
        if (challenge.prompts[0].validation === ChallengeValidation.AccountPassword) {
          if (challenge.reason === ChallengeReason.AddPasscode) {
            didPromptForPassword = true
          }
          values = challenge.prompts.map(
            (prompt) =>
              CreateChallengeValue(
                prompt,
                prompt.validation === ChallengeValidation.AccountPassword
                  ? password
                  : UnprotectedAccessSecondsDuration.OneHour,
              ),
          )
        } else {
          values = [CreateChallengeValue(challenge.prompts[0], passcode)]
        }

        application.submitValuesForChallenge(challenge, values)
      },
    })

    await application.launch(true)
    await Factory.registerUserToApplication({
      application: application,
      email: UuidGenerator.GenerateUuid(),
      password,
    })

    await application.addPasscode(passcode)
    expect(didPromptForPassword).to.equal(true)
  })

  it('authorizes note access when no password or passcode are set', async function () {
    application = await Factory.createInitAppWithFakeCrypto()

    let note = await Factory.createMappedNote(application)
    note = await application.protections.protectNote(note)

    expect(await application.authorizeNoteAccess(note)).to.be.true
  })

  it('authorizes autolock interval change', async function () {
    const passcode = 'passcode'

    application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
    await application.prepareForLaunch({
      receiveChallenge: (challenge) => {
        expect(challenge.prompts.find((prompt) => prompt.validation === ChallengeValidation.LocalPasscode)).to.be.ok
        const values = challenge.prompts.map(
          (prompt) =>
            CreateChallengeValue(
              prompt,
              prompt.validation === ChallengeValidation.LocalPasscode
                ? passcode
                : UnprotectedAccessSecondsDuration.OneMinute,
            ),
        )

        application.submitValuesForChallenge(challenge, values)
      },
    })
    await application.launch(true)

    await application.addPasscode(passcode)

    expect(await application.authorizeAutolockIntervalChange()).to.be.true
  })

  it('authorizes batch manager access', async function () {
    const passcode = 'passcode'

    application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
    await application.prepareForLaunch({
      receiveChallenge: (challenge) => {
        expect(challenge.prompts.find((prompt) => prompt.validation === ChallengeValidation.LocalPasscode)).to.be.ok
        const values = challenge.prompts.map(
          (prompt) =>
            CreateChallengeValue(
              prompt,
              prompt.validation === ChallengeValidation.LocalPasscode
                ? passcode
                : UnprotectedAccessSecondsDuration.OneMinute,
            ),
        )

        application.submitValuesForChallenge(challenge, values)
      },
    })
    await application.launch(true)

    await application.addPasscode(passcode)

    expect(await application.authorizeAutolockIntervalChange()).to.be.true
  })

  it('handles session length', async function () {
    application = await Factory.createInitAppWithFakeCrypto()
    await application.protections.setSessionLength(300)
    const length = await application.protections.getLastSessionLength()
    expect(length).to.equal(300)
    const expirey = await application.getProtectionSessionExpiryDate()
    expect(expirey).to.be.ok
  })

  it('handles session length', async function () {
    application = await Factory.createInitAppWithFakeCrypto()
    await application.protections.setSessionLength(UnprotectedAccessSecondsDuration.OneMinute)
    const length = await application.protections.getLastSessionLength()
    expect(length).to.equal(UnprotectedAccessSecondsDuration.OneMinute)
    const expirey = await application.getProtectionSessionExpiryDate()
    expect(expirey).to.be.ok
  })

  describe('hasProtectionSources', function () {
    it('no account, no passcode, no biometrics', async function () {
      application = await Factory.createInitAppWithFakeCrypto()
      expect(application.hasProtectionSources()).to.be.false
    })

    it('no account, no passcode, biometrics', async function () {
      application = await Factory.createInitAppWithFakeCrypto()
      await application.protections.enableBiometrics()
      expect(application.hasProtectionSources()).to.be.true
    })

    it('no account, passcode, no biometrics', async function () {
      application = await Factory.createInitAppWithFakeCrypto()
      await application.addPasscode('passcode')
      expect(application.hasProtectionSources()).to.be.true
    })

    it('no account, passcode, biometrics', async function () {
      application = await Factory.createInitAppWithFakeCrypto()
      await application.addPasscode('passcode')
      await application.protections.enableBiometrics()
      expect(application.hasProtectionSources()).to.be.true
    })

    it('account, no passcode, no biometrics', async function () {
      application = await Factory.createInitAppWithFakeCrypto()
      await Factory.registerUserToApplication({
        application: application,
        email: UuidGenerator.GenerateUuid(),
        password: UuidGenerator.GenerateUuid(),
      })
      expect(application.hasProtectionSources()).to.be.true
    })

    it('account, no passcode, biometrics', async function () {
      application = await Factory.createInitAppWithFakeCrypto()
      await Factory.registerUserToApplication({
        application: application,
        email: UuidGenerator.GenerateUuid(),
        password: UuidGenerator.GenerateUuid(),
      })
      await application.protections.enableBiometrics()
      expect(application.hasProtectionSources()).to.be.true
    })

    it('account, passcode, no biometrics', async function () {
      application = await Factory.createInitAppWithFakeCrypto()
      const password = UuidGenerator.GenerateUuid()
      await Factory.registerUserToApplication({
        application: application,
        email: UuidGenerator.GenerateUuid(),
        password,
      })
      Factory.handlePasswordChallenges(application, password)
      await application.addPasscode('passcode')
      expect(application.hasProtectionSources()).to.be.true
    })

    it('account, passcode, biometrics', async function () {
      application = await Factory.createInitAppWithFakeCrypto()
      const password = UuidGenerator.GenerateUuid()
      await Factory.registerUserToApplication({
        application: application,
        email: UuidGenerator.GenerateUuid(),
        password,
      })
      Factory.handlePasswordChallenges(application, password)
      await application.addPasscode('passcode')
      await application.protections.enableBiometrics()
      expect(application.hasProtectionSources()).to.be.true
    })
  })

  describe('hasUnprotectedAccessSession', function () {
    it('should return false when session length has not been set', async function () {
      this.foo = 'tar'
      application = await Factory.createInitAppWithFakeCrypto()
      await application.addPasscode('passcode')
      expect(application.protections.hasUnprotectedAccessSession()).to.be.false
    })

    it('should return true when session length has been set', async function () {
      application = await Factory.createInitAppWithFakeCrypto()
      await application.addPasscode('passcode')
      await application.protections.setSessionLength(UnprotectedAccessSecondsDuration.OneMinute)
      expect(application.protections.hasUnprotectedAccessSession()).to.be.true
    })

    it('should return true when there are no protection sources', async function () {
      application = await Factory.createInitAppWithFakeCrypto()
      expect(application.protections.hasUnprotectedAccessSession()).to.be.true
    })
  })

  describe('authorizeProtectedActionForNotes', function () {
    it('prompts for password once with the right challenge reason when one or more notes are protected', async function () {
      let challengePrompts = 0
      application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
      const password = UuidGenerator.GenerateUuid()

      await application.prepareForLaunch({
        receiveChallenge: (challenge) => {
          challengePrompts += 1
          expect(challenge.prompts.find((prompt) => prompt.validation === ChallengeValidation.AccountPassword)).to.be.ok
          expect(challenge.reason).to.equal(ChallengeReason.SelectProtectedNote)
          const values = challenge.prompts.map(
            (prompt) =>
              CreateChallengeValue(
                prompt,
                prompt.validation === ChallengeValidation.AccountPassword
                  ? password
                  : UnprotectedAccessSecondsDuration.OneMinute,
              ),
          )
          application.submitValuesForChallenge(challenge, values)
        },
      })
      await application.launch(true)
      await Factory.registerUserToApplication({
        application: application,
        email: UuidGenerator.GenerateUuid(),
        password,
      })

      const NOTE_COUNT = 3
      let notes = await Factory.createManyMappedNotes(application, NOTE_COUNT)

      notes[0] = await application.protections.protectNote(notes[0])
      notes[1] = await application.protections.protectNote(notes[1])

      expect(await application.authorizeProtectedActionForNotes(notes, ChallengeReason.SelectProtectedNote)).lengthOf(
        NOTE_COUNT,
      )
      expect(challengePrompts).to.equal(1)
    })

    it('prompts for passcode once with the right challenge reason when one or more notes are protected', async function () {
      let challengePrompts = 0
      application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
      const passcode = 'passcode'

      await application.prepareForLaunch({
        receiveChallenge: (challenge) => {
          challengePrompts += 1
          expect(challenge.prompts.find((prompt) => prompt.validation === ChallengeValidation.LocalPasscode)).to.be.ok
          expect(challenge.reason).to.equal(ChallengeReason.SelectProtectedNote)
          const values = challenge.prompts.map(
            (prompt) =>
              CreateChallengeValue(
                prompt,
                prompt.validation === ChallengeValidation.LocalPasscode
                  ? passcode
                  : UnprotectedAccessSecondsDuration.OneMinute,
              ),
          )

          application.submitValuesForChallenge(challenge, values)
        },
      })
      await application.launch(true)
      await application.addPasscode(passcode)

      const NOTE_COUNT = 3
      let notes = await Factory.createManyMappedNotes(application, NOTE_COUNT)
      notes[0] = await application.protections.protectNote(notes[0])
      notes[1] = await application.protections.protectNote(notes[1])

      expect(await application.authorizeProtectedActionForNotes(notes, ChallengeReason.SelectProtectedNote)).lengthOf(
        NOTE_COUNT,
      )
      expect(challengePrompts).to.equal(1)
    })

    it('does not return protected notes if challenge is canceled', async function () {
      const passcode = 'passcode'
      let challengePrompts = 0

      application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
      await application.prepareForLaunch({
        receiveChallenge: (challenge) => {
          challengePrompts++
          application.cancelChallenge(challenge)
        },
      })
      await application.launch(true)
      await application.addPasscode(passcode)

      const NOTE_COUNT = 3
      let notes = await Factory.createManyMappedNotes(application, NOTE_COUNT)
      notes[0] = await application.protections.protectNote(notes[0])
      notes[1] = await application.protections.protectNote(notes[1])

      expect(await application.authorizeProtectedActionForNotes(notes, ChallengeReason.SelectProtectedNote)).lengthOf(1)
      expect(challengePrompts).to.equal(1)
    })
  })

  describe('protectNotes', function () {
    it('protects all notes', async function () {
      application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
      await application.prepareForLaunch({
        receiveChallenge: (challenge) => {
          application.cancelChallenge(challenge)
        },
      })
      await application.launch(true)

      const NOTE_COUNT = 3
      let notes = await Factory.createManyMappedNotes(application, NOTE_COUNT)
      notes = await application.protections.protectNotes(notes)

      for (const note of notes) {
        expect(note.protected).to.be.true
      }
    })
  })

  describe('unprotect notes', function () {
    it('prompts for password and unprotects all notes if challenge is succesful', async function () {
      let challengePrompts = 0
      application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
      const passcode = 'passcode'

      await application.prepareForLaunch({
        receiveChallenge: (challenge) => {
          challengePrompts += 1
          expect(challenge.prompts.find((prompt) => prompt.validation === ChallengeValidation.LocalPasscode)).to.be.ok
          expect(challenge.reason).to.equal(ChallengeReason.UnprotectNote)
          const values = challenge.prompts.map(
            (prompt) =>
              CreateChallengeValue(
                prompt,
                prompt.validation === ChallengeValidation.LocalPasscode
                  ? passcode
                  : UnprotectedAccessSecondsDuration.OneMinute,
              ),
          )

          application.submitValuesForChallenge(challenge, values)
        },
      })
      await application.launch(true)
      await application.addPasscode(passcode)

      const NOTE_COUNT = 3
      let notes = await Factory.createManyMappedNotes(application, NOTE_COUNT)
      notes = await application.protections.protectNotes(notes)
      notes = await application.protections.unprotectNotes(notes)

      for (const note of notes) {
        expect(note.protected).to.be.false
      }
      expect(challengePrompts).to.equal(1)
    })

    it('prompts for passcode and unprotects all notes if challenge is succesful', async function () {
      let challengePrompts = 0
      application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
      const passcode = 'passcode'

      await application.prepareForLaunch({
        receiveChallenge: (challenge) => {
          challengePrompts += 1
          expect(challenge.prompts.find((prompt) => prompt.validation === ChallengeValidation.LocalPasscode)).to.be.ok
          expect(challenge.reason).to.equal(ChallengeReason.UnprotectNote)
          const values = challenge.prompts.map(
            (prompt) =>
              CreateChallengeValue(
                prompt,
                prompt.validation === ChallengeValidation.LocalPasscode
                  ? passcode
                  : UnprotectedAccessSecondsDuration.OneMinute,
              ),
          )

          application.submitValuesForChallenge(challenge, values)
        },
      })
      await application.launch(true)
      await application.addPasscode(passcode)

      const NOTE_COUNT = 3
      let notes = await Factory.createManyMappedNotes(application, NOTE_COUNT)
      notes = await application.protections.protectNotes(notes)
      notes = await application.protections.unprotectNotes(notes)

      for (const note of notes) {
        expect(note.protected).to.be.false
      }
      expect(challengePrompts).to.equal(1)
    })

    it('does not unprotect any notes if challenge is canceled', async function () {
      const passcode = 'passcode'
      let challengePrompts = 0

      application = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
      await application.prepareForLaunch({
        receiveChallenge: (challenge) => {
          challengePrompts++
          application.cancelChallenge(challenge)
        },
      })
      await application.launch(true)
      await application.addPasscode(passcode)

      const NOTE_COUNT = 3
      let notes = await Factory.createManyMappedNotes(application, NOTE_COUNT)
      notes = await application.protections.protectNotes(notes)
      notes = await application.protections.unprotectNotes(notes)

      for (const note of notes) {
        expect(note.protected).to.be(true)
      }
      expect(challengePrompts).to.equal(1)
    })
  })
})
