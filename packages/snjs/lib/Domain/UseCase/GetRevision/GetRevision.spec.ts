import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { RevisionClientInterface } from '@standardnotes/services'

import { Revision } from '../../Revision/Revision'

import { GetRevision } from './GetRevision'

describe('GetRevision', () => {
  let revisionManager: RevisionClientInterface
  let protocolService: EncryptionProviderInterface

  const createUseCase = () => new GetRevision(revisionManager, protocolService)

  beforeEach(() => {
    revisionManager = {} as jest.Mocked<RevisionClientInterface>
    revisionManager.getRevision = jest.fn().mockReturnValue({} as jest.Mocked<Revision>)

    protocolService = {} as jest.Mocked<EncryptionProviderInterface>
    protocolService.getEmbeddedPayloadAuthenticatedData = jest.fn().mockReturnValue({ u: '00000000-0000-0000-0000-000000000000' })
  })

  it('should get revision', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(false)
    expect(result.getValue()).toEqual({})
  })

  it('should fail if item uuid is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: 'invalid',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not list item revisions: Given value is not a valid uuid: invalid')
  })

  it('should fail if revision uuid is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: 'invalid',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not list item revisions: Given value is not a valid uuid: invalid')
  })

  it('should fail if revision is not found', async () => {
    revisionManager.getRevision = jest.fn().mockReturnValue(null)

    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not get revision: Revision not found')
  })
})
