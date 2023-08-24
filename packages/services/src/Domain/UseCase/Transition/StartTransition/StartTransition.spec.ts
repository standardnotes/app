import { HttpServiceInterface } from '@standardnotes/api'

import { StartTransition } from './StartTransition'

describe('StartTransition', () => {
  let httpService: HttpServiceInterface

  const createUseCase = () => new StartTransition(httpService)

  beforeEach(() => {
    httpService = {
      post: jest.fn(),
    } as unknown as HttpServiceInterface
  })

  it('should start transition', async () => {
    const useCase = createUseCase()
    ;(httpService.post as jest.Mock).mockResolvedValueOnce({ status: 200 })

    const result = await useCase.execute()

    expect(result.isFailed()).toBe(false)
  })

  it('should fail to start transition', async () => {
    const useCase = createUseCase()
    ;(httpService.post as jest.Mock).mockResolvedValueOnce({ status: 400 })

    const result = await useCase.execute()

    expect(result.isFailed()).toBe(true)
  })
})
