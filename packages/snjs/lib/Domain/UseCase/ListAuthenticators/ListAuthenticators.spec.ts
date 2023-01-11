import { AuthenticatorClientInterface } from '@standardnotes/services'

import { ListAuthenticators } from './ListAuthenticators'

describe('ListAuthenticators', () => {
  let authenticatorClient: AuthenticatorClientInterface

  const createUseCase = () => new ListAuthenticators(authenticatorClient)

  beforeEach(() => {
    authenticatorClient = {} as jest.Mocked<AuthenticatorClientInterface>
    authenticatorClient.list = jest.fn().mockReturnValue([{ id: '1-2-3', name: 'My First Key' }])
  })

  it('should list authenticators', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute()

    expect(result.isFailed()).toBe(false)
    expect(result.getValue()).toEqual([{ id: '1-2-3', name: 'My First Key' }])
  })
})
