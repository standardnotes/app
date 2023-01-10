import { AuthClientInterface } from '@standardnotes/services'
import { SettingsClientInterface } from '@Lib/Services/Settings/SettingsClientInterface'

import { GetRecoveryCodes } from './GetRecoveryCodes'

describe('GetRecoveryCodes', () => {
  let authClient: AuthClientInterface
  let settingsClient: SettingsClientInterface

  const createUseCase = () => new GetRecoveryCodes(authClient, settingsClient)

  beforeEach(() => {
    authClient = {} as jest.Mocked<AuthClientInterface>
    authClient.generateRecoveryCodes = jest.fn().mockResolvedValue('recovery-codes')

    settingsClient = {} as jest.Mocked<SettingsClientInterface>
    settingsClient.getSetting = jest.fn().mockResolvedValue('existing-recovery-codes')
  })

  it('should return existing recovery code if they exist', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute()

    expect(result.getValue()).toBe('existing-recovery-codes')
  })

  it('should generate recovery code if they do not exist', async () => {
    settingsClient.getSetting = jest.fn().mockResolvedValue(undefined)

    const useCase = createUseCase()

    const result = await useCase.execute()

    expect(result.getValue()).toBe('recovery-codes')
  })

  it('should return error if recovery code could not be generated', async () => {
    settingsClient.getSetting = jest.fn().mockResolvedValue(undefined)
    authClient.generateRecoveryCodes = jest.fn().mockResolvedValue(false)

    const useCase = createUseCase()

    const result = await useCase.execute()

    expect(result.isFailed()).toBe(true)
  })
})
