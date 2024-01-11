import { SyncFrequencyGuard } from './SyncFrequencyGuard'

describe('SyncFrequencyGuard', () => {
  const createUseCase = () => new SyncFrequencyGuard(3)

  it('should return false when sync calls threshold is not reached', () => {
    const useCase = createUseCase()

    expect(useCase.isSyncCallsThresholdReachedThisMinute()).toBe(false)
  })

  it('should return true when sync calls threshold is reached', () => {
    const useCase = createUseCase()

    useCase.incrementCallsPerMinute()
    useCase.incrementCallsPerMinute()
    useCase.incrementCallsPerMinute()

    expect(useCase.isSyncCallsThresholdReachedThisMinute()).toBe(true)
  })

  it('should return false when sync calls threshold is reached but a new minute has started', () => {
    const spyOnGetCallsPerMinuteKey = jest.spyOn(SyncFrequencyGuard.prototype as any, 'getCallsPerMinuteKey')
    spyOnGetCallsPerMinuteKey.mockReturnValueOnce('2020-1-1T1:1')

    const useCase = createUseCase()

    useCase.incrementCallsPerMinute()
    useCase.incrementCallsPerMinute()
    useCase.incrementCallsPerMinute()

    spyOnGetCallsPerMinuteKey.mockReturnValueOnce('2020-1-1T1:2')

    expect(useCase.isSyncCallsThresholdReachedThisMinute()).toBe(false)

    spyOnGetCallsPerMinuteKey.mockRestore()
  })
})
