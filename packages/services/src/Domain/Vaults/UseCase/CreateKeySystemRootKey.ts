import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContentType } from '@standardnotes/common'
import {
  FillItemContent,
  KeySystemRootKeyContent,
  KeySystemRootKeyContentSpecialized,
  KeySystemRootKeyInterface,
} from '@standardnotes/models'

export class CreateKeySystemRootKeyUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(content: KeySystemRootKeyContentSpecialized): Promise<KeySystemRootKeyInterface> {
    const newKeySystemRootKey = await this.items.createItem<KeySystemRootKeyInterface>(
      ContentType.KeySystemRootKey,
      FillItemContent<KeySystemRootKeyContent>(content),
      true,
    )

    return newKeySystemRootKey
  }
}
