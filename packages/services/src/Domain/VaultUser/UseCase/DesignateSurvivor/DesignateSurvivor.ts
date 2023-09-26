import { Result, UseCaseInterface, Uuid } from '@standardnotes/domain-core'
import { SharedVaultUsersServerInterface } from '@standardnotes/api'
import { HttpStatusCode } from '@standardnotes/responses'

import { DesignateSurvivorDTO } from './DesignateSurvivorDTO'

export class DesignateSurvivor implements UseCaseInterface<void> {
  constructor(private sharedVaultUserServer: SharedVaultUsersServerInterface) {}

  async execute(dto: DesignateSurvivorDTO): Promise<Result<void>> {
    const sharedVaultUuidOrError = Uuid.create(dto.sharedVaultUuid)
    if (sharedVaultUuidOrError.isFailed()) {
      return Result.fail(sharedVaultUuidOrError.getError())
    }
    const sharedVaultUuid = sharedVaultUuidOrError.getValue()

    const sharedVaultMemberUuidOrError = Uuid.create(dto.sharedVaultMemberUuid)
    if (sharedVaultMemberUuidOrError.isFailed()) {
      return Result.fail(sharedVaultMemberUuidOrError.getError())
    }
    const sharedVaultMemberUuid = sharedVaultMemberUuidOrError.getValue()

    const response = await this.sharedVaultUserServer.designateSurvivor({
      sharedVaultUuid,
      sharedVaultMemberUuid,
    })

    if (response.status !== HttpStatusCode.Success) {
      return Result.fail('Failed to mark designated survivor on the server')
    }

    return Result.ok()
  }
}
