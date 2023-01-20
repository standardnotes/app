import { RevisionClientInterface } from '@standardnotes/services'
import { Result, UseCaseInterface, Uuid } from '@standardnotes/domain-core'

import { RevisionMetadata } from '../../Revision/RevisionMetadata'

import { ListRevisionsDTO } from './ListRevisionsDTO'

export class ListRevisions implements UseCaseInterface<Array<RevisionMetadata>> {
  constructor(private revisionManager: RevisionClientInterface) {}

  async execute(dto: ListRevisionsDTO): Promise<Result<RevisionMetadata[]>> {
    const itemUuidOrError = Uuid.create(dto.itemUuid)
    if (itemUuidOrError.isFailed()) {
      return Result.fail(`Could not list item revisions: ${itemUuidOrError.getError()}`)
    }
    const itemUuid = itemUuidOrError.getValue()

    try {
      const revisions = await this.revisionManager.listRevisions(itemUuid)

      return Result.ok(revisions)
    } catch (error) {
      return Result.fail(`Could not list item revisions: ${(error as Error).message}`)
    }
  }
}
