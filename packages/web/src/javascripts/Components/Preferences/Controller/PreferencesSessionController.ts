import { action, makeAutoObservable, observable } from 'mobx'
import { WebApplication } from '@/Application/WebApplication'
import { PackageProvider } from '../Panes/Plugins/PackageProvider'
import { securityPrefsHasBubble } from '../Panes/Security/securityPrefsHasBubble'
import { PreferencePaneId, StatusServiceEvent } from '@standardnotes/services'
import { isDesktopApplication } from '@/Utils'
import { PreferencesMenuItem } from './PreferencesMenuItem'
import { SelectableMenuItem } from './SelectableMenuItem'
import { PREFERENCES_MENU_ITEMS, READY_PREFERENCES_MENU_ITEMS } from './MenuItems'

/**
 * Unlike PreferencesController, the PreferencesSessionController is ephemeral and bound to a single opening of the
 * Preferences menu. It is created and destroyed each time the menu is opened and closed.
 */
export class PreferencesSessionController {
  private _selectedPane: PreferencePaneId = 'account'
  private _menu: PreferencesMenuItem[]
  private _extensionLatestVersions: PackageProvider = new PackageProvider(new Map())

  constructor(
    private application: WebApplication,
    private readonly _enableUnfinishedFeatures: boolean,
  ) {
    const menuItems = this._enableUnfinishedFeatures
      ? PREFERENCES_MENU_ITEMS.slice()
      : READY_PREFERENCES_MENU_ITEMS.slice()

    if (application.featuresController.isVaultsEnabled()) {
      menuItems.push({ id: 'vaults', label: 'Vaults', icon: 'safe-square', order: 5 })
    }

    if (isDesktopApplication()) {
      menuItems.push({ id: 'home-server', label: 'Home Server', icon: 'server', order: 5 })
    }

    this._menu = menuItems.sort((a, b) => a.order - b.order)

    this.loadLatestVersions()

    makeAutoObservable<
      PreferencesSessionController,
      | '_selectedPane'
      | '_twoFactorAuth'
      | '_extensionPanes'
      | '_extensionLatestVersions'
      | 'loadLatestVersions'
      | 'updateMenuBubbleCounts'
    >(this, {
      _twoFactorAuth: observable,
      _selectedPane: observable,
      _extensionPanes: observable.ref,
      _extensionLatestVersions: observable.ref,
      loadLatestVersions: action,
      updateMenuBubbleCounts: action,
    })

    this.application.status.addEventObserver((event) => {
      if (event === StatusServiceEvent.PreferencesBubbleCountChanged) {
        this.updateMenuBubbleCounts()
      }
    })
  }

  private updateMenuBubbleCounts(): void {
    this._menu = this._menu.map((item) => {
      return {
        ...item,
        bubbleCount: this.application.status.getPreferencesBubbleCount(item.id),
      }
    })
  }

  private loadLatestVersions(): void {
    PackageProvider.load()
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
        bubbleCount: this.application.status.getPreferencesBubbleCount(preference.id),
        hasErrorIndicator: this.sectionHasBubble(preference.id),
      }
      return item
    })

    return menuItems
  }

  get selectedMenuItem(): PreferencesMenuItem | undefined {
    return this._menu.find((item) => item.id === this._selectedPane)
  }

  get selectedPaneId(): PreferencePaneId {
    if (this.selectedMenuItem != undefined) {
      return this.selectedMenuItem.id
    }

    return 'account'
  }

  selectPane = (key: PreferencePaneId) => {
    this._selectedPane = key
  }

  sectionHasBubble(id: PreferencePaneId): boolean {
    if (id === 'security') {
      return securityPrefsHasBubble(this.application)
    }

    return false
  }
}
