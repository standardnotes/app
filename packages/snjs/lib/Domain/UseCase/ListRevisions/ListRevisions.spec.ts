import { RevisionClientInterface } from '@standardnotes/services'

import { ListRevisions } from './ListRevisions'

describe('ListRevisions', () => {
  let revisionManager: RevisionClientInterface

  const createUseCase = () => new ListRevisions(revisionManager)

  beforeEach(() => {
    revisionManager = {} as jest.Mocked<RevisionClientInterface>
    revisionManager.listRevisions = jest.fn().mockReturnValue([])
  })

  it('should list revisions', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({ itemUuid: '00000000-0000-0000-0000-000000000000' })

    expect(result.isFailed()).toBe(false)
    expect(result.getValue()).toEqual([])
  })

  it('should fail if item uuid is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({ itemUuid: 'invalid' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not list item revisions: Given value is not a valid uuid: invalid')
  })

  it('should fail if revision manager throws', async () => {
    const useCase = createUseCase()

    revisionManager.listRevisions = jest.fn().mockRejectedValue(new Error('error'))

    const result = await useCase.execute({ itemUuid: '00000000-0000-0000-0000-000000000000' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toEqual('Could not list item revisions: error')
  })
})
