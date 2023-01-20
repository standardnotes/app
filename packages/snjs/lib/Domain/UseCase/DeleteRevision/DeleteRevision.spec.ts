import { RevisionClientInterface } from '@standardnotes/services'

import { DeleteRevision } from './DeleteRevision'

describe('DeleteRevision', () => {
  let revisionManager: RevisionClientInterface

  const createUseCase = () => new DeleteRevision(revisionManager)

  beforeEach(() => {
    revisionManager = {} as jest.Mocked<RevisionClientInterface>
    revisionManager.deleteRevision = jest.fn()
  })

  it('should delete revision', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(false)
  })

  it('should fail if item uuid is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: 'invalid',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not delete revision: Given value is not a valid uuid: invalid')
  })

  it('should fail if revision uuid is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: 'invalid',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not delete revision: Given value is not a valid uuid: invalid')
  })

  it('should fail if revision manager throws', async () => {
    const useCase = createUseCase()

    revisionManager.deleteRevision = jest.fn().mockRejectedValue(new Error('error'))

    const result = await useCase.execute({
      itemUuid: '00000000-0000-0000-0000-000000000000',
      revisionUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not delete revision: error')
  })
})
