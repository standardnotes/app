import { AppDataField } from '../../Abstract/Item/Types/AppDataField'
import { ComponentContent } from '../Component/ComponentContent'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'

export class ThemeMutator extends DecryptedItemMutator<ComponentContent> {
  setMobileRules(rules: unknown) {
    this.setAppDataItem(AppDataField.MobileRules, rules)
  }

  setNotAvailOnMobile(notAvailable: boolean) {
    this.setAppDataItem(AppDataField.NotAvailableOnMobile, notAvailable)
  }

  set local_url(local_url: string) {
    this.mutableContent.local_url = local_url
  }

  /**
   * We must not use .active because if you set that to true, it will also
   * activate that theme on desktop/web
   */
  setMobileActive(active: boolean) {
    this.setAppDataItem(AppDataField.MobileActive, active)
  }
}
