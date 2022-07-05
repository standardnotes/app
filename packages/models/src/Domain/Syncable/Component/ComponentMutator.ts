import { addIfUnique, removeFromArray } from '@standardnotes/utils'
import { Uuid } from '@standardnotes/common'
import { ComponentPermission, FeatureDescription } from '@standardnotes/features'
import { AppDataField } from '../../Abstract/Item/Types/AppDataField'
import { ComponentContent } from './ComponentContent'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'

export class ComponentMutator extends DecryptedItemMutator<ComponentContent> {
  set active(active: boolean) {
    this.mutableContent.active = active
  }

  set isMobileDefault(isMobileDefault: boolean) {
    this.mutableContent.isMobileDefault = isMobileDefault
  }

  set defaultEditor(defaultEditor: boolean) {
    this.setAppDataItem(AppDataField.DefaultEditor, defaultEditor)
  }

  set componentData(componentData: Record<string, unknown>) {
    this.mutableContent.componentData = componentData
  }

  set package_info(package_info: FeatureDescription) {
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

  public associateWithItem(uuid: Uuid): void {
    const associated = this.mutableContent.associatedItemIds || []
    addIfUnique(associated, uuid)
    this.mutableContent.associatedItemIds = associated
  }

  public disassociateWithItem(uuid: Uuid): void {
    const disassociated = this.mutableContent.disassociatedItemIds || []
    addIfUnique(disassociated, uuid)
    this.mutableContent.disassociatedItemIds = disassociated
  }

  public removeAssociatedItemId(uuid: Uuid): void {
    removeFromArray(this.mutableContent.associatedItemIds || [], uuid)
  }

  public removeDisassociatedItemId(uuid: Uuid): void {
    removeFromArray(this.mutableContent.disassociatedItemIds || [], uuid)
  }

  public setLastSize(size: string): void {
    this.setAppDataItem(AppDataField.LastSize, size)
  }
}
