import { action, makeAutoObservable, observable } from 'mobx'
import { IconType } from '@standardnotes/snjs'
import { WebApplication } from '@/Application/Application'
import { PackageProvider } from './Panes/General/Advanced/Packages/Provider/PackageProvider'
import { securityPrefsHasBubble } from './Panes/Security/securityPrefsHasBubble'
import { PreferenceId } from '@standardnotes/ui-services'

interface PreferencesMenuItem {
  readonly id: PreferenceId
  readonly icon: IconType
  readonly label: string
  readonly hasBubble?: boolean
}

interface SelectableMenuItem extends PreferencesMenuItem {
  selected: boolean
}

/**
 * Items are in order of appearance
 */
const PREFERENCES_MENU_ITEMS: PreferencesMenuItem[] = [
  { id: 'whats-new', label: "What's New", icon: 'asterisk' },
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'security', label: 'Security', icon: 'security' },
  { id: 'backups', label: 'Backups', icon: 'restore' },
  { id: 'appearance', label: 'Appearance', icon: 'themes' },
  { id: 'listed', label: 'Listed', icon: 'listed' },
  { id: 'shortcuts', label: 'Shortcuts', icon: 'keyboard' },
  { id: 'accessibility', label: 'Accessibility', icon: 'accessibility' },
  { id: 'get-free-month', label: 'Get a free month', icon: 'star' },
  { id: 'help-feedback', label: 'Help & feedback', icon: 'help' },
]

const READY_PREFERENCES_MENU_ITEMS: PreferencesMenuItem[] = [
  { id: 'whats-new', label: "What's New", icon: 'asterisk' },
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'security', label: 'Security', icon: 'security' },
  { id: 'backups', label: 'Backups', icon: 'restore' },
  { id: 'appearance', label: 'Appearance', icon: 'themes' },
  { id: 'listed', label: 'Listed', icon: 'listed' },
  { id: 'help-feedback', label: 'Help & feedback', icon: 'help' },
]

export class PreferencesMenu {
  private _selectedPane: PreferenceId = 'account'
  private _menu: PreferencesMenuItem[]
  private _extensionLatestVersions: PackageProvider = new PackageProvider(new Map())

  constructor(private application: WebApplication, private readonly _enableUnfinishedFeatures: boolean) {
    this._menu = this._enableUnfinishedFeatures ? PREFERENCES_MENU_ITEMS : READY_PREFERENCES_MENU_ITEMS

    this.loadLatestVersions()

    makeAutoObservable<
      PreferencesMenu,
      '_selectedPane' | '_twoFactorAuth' | '_extensionPanes' | '_extensionLatestVersions' | 'loadLatestVersions'
    >(this, {
      _twoFactorAuth: observable,
      _selectedPane: observable,
      _extensionPanes: observable.ref,
      _extensionLatestVersions: observable.ref,
      loadLatestVersions: action,
    })
  }

  private loadLatestVersions(): void {
    PackageProvider.load(this.application)
      .then((versions) => {
        if (versions) {
          this._extensionLatestVersions = versions
        }
      })
      .catch(console.error)
  }

  get extensionsLatestVersions(): PackageProvider {
    return this._extensionLatestVersions
  }

  get menuItems(): SelectableMenuItem[] {
    const menuItems = this._menu.map((preference) => {
      const item: SelectableMenuItem = {
        ...preference,
        selected: preference.id === this._selectedPane,
        hasBubble: this.sectionHasBubble(preference.id),
      }
      return item
    })

    return menuItems
  }

  get selectedMenuItem(): PreferencesMenuItem | undefined {
    return this._menu.find((item) => item.id === this._selectedPane)
  }

  get selectedPaneId(): PreferenceId {
    if (this.selectedMenuItem != undefined) {
      return this.selectedMenuItem.id
    }

    return 'account'
  }

  selectPane = (key: PreferenceId) => {
    this._selectedPane = key
  }

  sectionHasBubble(id: PreferenceId): boolean {
    if (id === 'security') {
      return securityPrefsHasBubble(this.application)
    }

    return false
  }
}
