import { action, makeAutoObservable, observable } from 'mobx'
import { IconType } from '@standardnotes/snjs'
import { WebApplication } from '@/Application/WebApplication'
import { PackageProvider } from './Panes/General/Advanced/Packages/Provider/PackageProvider'
import { securityPrefsHasBubble } from './Panes/Security/securityPrefsHasBubble'
import { PreferenceId } from '@standardnotes/ui-services'
import { isDesktopApplication } from '@/Utils'

interface PreferencesMenuItem {
  readonly id: PreferenceId
  readonly icon: IconType
  readonly label: string
  readonly order: number
  readonly hasBubble?: boolean
}

interface SelectableMenuItem extends PreferencesMenuItem {
  selected: boolean
}

/**
 * Items are in order of appearance
 */
const PREFERENCES_MENU_ITEMS: PreferencesMenuItem[] = [
  { id: 'whats-new', label: "What's New", icon: 'asterisk', order: 0 },
  { id: 'account', label: 'Account', icon: 'user', order: 1 },
  { id: 'general', label: 'General', icon: 'settings', order: 3 },
  { id: 'security', label: 'Security', icon: 'security', order: 4 },
  { id: 'backups', label: 'Backups', icon: 'restore', order: 5 },
  { id: 'appearance', label: 'Appearance', icon: 'themes', order: 6 },
  { id: 'listed', label: 'Listed', icon: 'listed', order: 7 },
  { id: 'shortcuts', label: 'Shortcuts', icon: 'keyboard', order: 8 },
  { id: 'accessibility', label: 'Accessibility', icon: 'accessibility', order: 9 },
  { id: 'get-free-month', label: 'Get a free month', icon: 'star', order: 10 },
  { id: 'help-feedback', label: 'Help & feedback', icon: 'help', order: 11 },
]

const READY_PREFERENCES_MENU_ITEMS: PreferencesMenuItem[] = [
  { id: 'whats-new', label: "What's New", icon: 'asterisk', order: 0 },
  { id: 'account', label: 'Account', icon: 'user', order: 1 },
  { id: 'general', label: 'General', icon: 'settings', order: 3 },
  { id: 'security', label: 'Security', icon: 'security', order: 4 },
  { id: 'backups', label: 'Backups', icon: 'restore', order: 5 },
  { id: 'appearance', label: 'Appearance', icon: 'themes', order: 6 },
  { id: 'listed', label: 'Listed', icon: 'listed', order: 7 },
  { id: 'help-feedback', label: 'Help & feedback', icon: 'help', order: 11 },
]

const DESKTOP_PREFERENCES_MENU_ITEMS: PreferencesMenuItem[] = [
  { id: 'home-server', label: 'Home Server', icon: 'folder', order: 2 },
]

export class PreferencesMenu {
  private _selectedPane: PreferenceId = 'account'
  private _menu: PreferencesMenuItem[]
  private _extensionLatestVersions: PackageProvider = new PackageProvider(new Map())

  constructor(private application: WebApplication, private readonly _enableUnfinishedFeatures: boolean) {
    const menuItems = this._enableUnfinishedFeatures ? PREFERENCES_MENU_ITEMS : READY_PREFERENCES_MENU_ITEMS

    if (isDesktopApplication()) {
      menuItems.push(...DESKTOP_PREFERENCES_MENU_ITEMS)
    }

    this._menu = menuItems.sort((a, b) => a.order - b.order)

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
