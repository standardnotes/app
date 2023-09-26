import { SharedVaultUsersServerInterface } from '@standardnotes/api'

import { DesignateSurvivor } from './DesignateSurvivor'

describe('DesignateSurvivor', () => {
  let sharedVaultUserServer: SharedVaultUsersServerInterface

  const createUseCase = () => new DesignateSurvivor(
    sharedVaultUserServer,
  )

  beforeEach(() => {
    sharedVaultUserServer = {} as jest.Mocked<SharedVaultUsersServerInterface>
    sharedVaultUserServer.designateSurvivor = jest.fn().mockReturnValue({
      status: 200,
    })
  })

  it('should mark designated survivor', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      sharedVaultUuid: '00000000-0000-0000-0000-000000000000',
      sharedVaultMemberUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(false)
  })

  it('should fail if shared vault uuid is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      sharedVaultUuid: 'invalid',
      sharedVaultMemberUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
  })

  it('should fail if shared vault member uuid is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      sharedVaultUuid: '00000000-0000-0000-0000-000000000000',
      sharedVaultMemberUuid: 'invalid',
    })

    expect(result.isFailed()).toBe(true)
  })

  it('should fail if shared vault user server fails', async () => {
    sharedVaultUserServer.designateSurvivor = jest.fn().mockReturnValue({
      status: 500,
    })

    const useCase = createUseCase()

    const result = await useCase.execute({
      sharedVaultUuid: '00000000-0000-0000-0000-000000000000',
      sharedVaultMemberUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
  })
})
