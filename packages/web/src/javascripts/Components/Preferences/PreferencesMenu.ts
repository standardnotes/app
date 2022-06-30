import { action, makeAutoObservable, observable } from 'mobx'
import { IconType } from '@standardnotes/snjs'
import { WebApplication } from '@/Application/Application'
import { ExtensionsLatestVersions } from './Panes/General/Extensions/ExtensionsLatestVersions'
import { securityPrefsHasBubble } from './Panes/Security/securityPrefsHasBubble'

const PREFERENCE_IDS = [
  'general',
  'account',
  'security',
  'appearance',
  'backups',
  'listed',
  'shortcuts',
  'accessibility',
  'get-free-month',
  'help-feedback',
] as const

export type PreferenceId = typeof PREFERENCE_IDS[number]

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
  private _extensionLatestVersions: ExtensionsLatestVersions = new ExtensionsLatestVersions(new Map())

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
    ExtensionsLatestVersions.load(this.application)
      .then((versions) => {
        if (versions) {
          this._extensionLatestVersions = versions
        }
      })
      .catch(console.error)
  }

  get extensionsLatestVersions(): ExtensionsLatestVersions {
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

  selectPane(key: PreferenceId): void {
    this._selectedPane = key
  }

  sectionHasBubble(id: PreferenceId): boolean {
    if (id === 'security') {
      return securityPrefsHasBubble(this.application)
    }

    return false
  }
}
