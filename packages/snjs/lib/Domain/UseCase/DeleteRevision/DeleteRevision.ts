import { RevisionClientInterface } from '@standardnotes/services'
import { Result, UseCaseInterface, Uuid } from '@standardnotes/domain-core'

import { DeleteRevisionDTO } from './DeleteRevisionDTO'

export class DeleteRevision implements UseCaseInterface<void> {
  constructor(private revisionManager: RevisionClientInterface) {}

  async execute(dto: DeleteRevisionDTO): Promise<Result<void>> {
    const itemUuidOrError = Uuid.create(dto.itemUuid)
    if (itemUuidOrError.isFailed()) {
      return Result.fail(`Could not delete revision: ${itemUuidOrError.getError()}`)
    }
    const itemUuid = itemUuidOrError.getValue()

    const revisionUuidOrError = Uuid.create(dto.revisionUuid)
    if (revisionUuidOrError.isFailed()) {
      return Result.fail(`Could not delete revision: ${revisionUuidOrError.getError()}`)
    }
    const revisionUuid = revisionUuidOrError.getValue()

    try {
      await this.revisionManager.deleteRevision(itemUuid, revisionUuid)

      return Result.ok()
    } catch (error) {
      return Result.fail(`Could not delete revision: ${(error as Error).message}`)
    }
  }
}
