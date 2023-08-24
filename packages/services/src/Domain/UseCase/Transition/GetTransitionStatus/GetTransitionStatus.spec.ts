import { HttpServiceInterface } from '@standardnotes/api'

import { GetTransitionStatus } from './GetTransitionStatus'

describe('GetTransitionStatus', () => {
  let httpService: HttpServiceInterface

  const createUseCase = () => new GetTransitionStatus(httpService)

  beforeEach(() => {
    httpService = {
      get: jest.fn(),
    } as unknown as HttpServiceInterface
  })

  it('should get transition status', async () => {
    const useCase = createUseCase()
    ;(httpService.get as jest.Mock).mockResolvedValueOnce({ status: 200, data: { status: 'TO-DO' } })

    const result = await useCase.execute()

    expect(result.isFailed()).toBe(false)
    expect(result.getValue()).toBe('TO-DO')
  })

  it('should fail to get transition status', async () => {
    const useCase = createUseCase()
    ;(httpService.get as jest.Mock).mockResolvedValueOnce({ status: 400 })

    const result = await useCase.execute()

    expect(result.isFailed()).toBe(true)
  })
})
