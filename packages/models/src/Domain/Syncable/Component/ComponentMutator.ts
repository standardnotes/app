import { addIfUnique, removeFromArray } from '@standardnotes/utils'
import { ComponentFeatureDescription, ComponentPermission } from '@standardnotes/features'
import { ComponentContent } from './ComponentContent'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'

export class ComponentMutator extends DecryptedItemMutator<ComponentContent> {
  set package_info(package_info: ComponentFeatureDescription) {
    this.mutableContent.package_info = package_info
  }

  set local_url(local_url: string) {
    this.mutableContent.local_url = local_url
  }

  set hosted_url(hosted_url: string) {
    this.mutableContent.hosted_url = hosted_url
  }

  set valid_until(valid_until: Date) {
    this.mutableContent.valid_until = valid_until
  }

  set permissions(permissions: ComponentPermission[]) {
    this.mutableContent.permissions = permissions
  }

  set name(name: string) {
    this.mutableContent.name = name
  }

  set offlineOnly(offlineOnly: boolean) {
    this.mutableContent.offlineOnly = offlineOnly
  }

  public associateWithItem(uuid: string): void {
    const associated = this.mutableContent.associatedItemIds || []
    addIfUnique(associated, uuid)
    this.mutableContent.associatedItemIds = associated
  }

  public disassociateWithItem(uuid: string): void {
    const disassociated = this.mutableContent.disassociatedItemIds || []
    addIfUnique(disassociated, uuid)
    this.mutableContent.disassociatedItemIds = disassociated
  }

  public removeAssociatedItemId(uuid: string): void {
    removeFromArray(this.mutableContent.associatedItemIds || [], uuid)
  }

  public removeDisassociatedItemId(uuid: string): void {
    removeFromArray(this.mutableContent.disassociatedItemIds || [], uuid)
  }
}
