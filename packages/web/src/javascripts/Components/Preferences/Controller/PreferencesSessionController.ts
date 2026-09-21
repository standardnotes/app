import { action, makeAutoObservable, observable, runInAction } from 'mobx'
import { c } from 'ttag'
import { WebApplication } from '@/Application/WebApplication'
import { PackageProvider } from '../Panes/Plugins/PackageProvider'
import { securityPrefsHasBubble } from '../Panes/Security/securityPrefsHasBubble'
import { PreferencePaneId, StatusServiceEvent } from '@standardnotes/services'
import { isDesktopApplication } from '@/Utils'
import { PreferencesMenuItem } from './PreferencesMenuItem'
import { SelectableMenuItem } from './SelectableMenuItem'
import { buildPreferencesMenuItems } from './MenuItems'

/**
 * Unlike PreferencesController, the PreferencesSessionController is ephemeral and bound to a single opening of the
 * Preferences menu. It is created and destroyed each time the menu is opened and closed.
 */
export class PreferencesSessionController {
  private _selectedPane: PreferencePaneId = 'account'
  private _preferencesBubbleRevision = 0
  private _extensionLatestVersions: PackageProvider = new PackageProvider(new Map())

  constructor(
    private application: WebApplication,
    private readonly _enableUnfinishedFeatures: boolean,
  ) {
    this.loadLatestVersions()

    makeAutoObservable<
      PreferencesSessionController,
      | '_selectedPane'
      | '_preferencesBubbleRevision'
      | '_twoFactorAuth'
      | '_extensionPanes'
      | '_extensionLatestVersions'
      | 'loadLatestVersions'
    >(this, {
      _twoFactorAuth: observable,
      _selectedPane: observable,
      _preferencesBubbleRevision: observable,
      _extensionPanes: observable.ref,
      _extensionLatestVersions: observable.ref,
      loadLatestVersions: action,
    })

    this.application.status.addEventObserver((event) => {
      if (event === StatusServiceEvent.PreferencesBubbleCountChanged) {
        runInAction(() => {
          this._preferencesBubbleRevision += 1
        })
      }
    })
  }

  private buildMenuItems(): PreferencesMenuItem[] {
    const menuItems = buildPreferencesMenuItems(this._enableUnfinishedFeatures)

    if (this.application.featuresController.isVaultsEnabled()) {
      menuItems.push({ id: 'vaults', label: c('B6.Preferences.Other.Label').t`Vaults`, icon: 'safe-square', order: 5 })
    }

    if (isDesktopApplication()) {
      menuItems.push({
        id: 'home-server',
        label: c('B6.Preferences.HomeServer.Label').t`Home Server`,
        icon: 'server',
        order: 5,
      })
    }

    return menuItems.sort((a, b) => a.order - b.order)
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
    void this._preferencesBubbleRevision

    return this.buildMenuItems().map((preference) => {
      const item: SelectableMenuItem = {
        ...preference,
        selected: preference.id === this._selectedPane,
        bubbleCount: this.application.status.getPreferencesBubbleCount(preference.id),
        hasErrorIndicator: this.sectionHasBubble(preference.id),
      }
      return item
    })
  }

  get selectedMenuItem(): PreferencesMenuItem | undefined {
    return this.buildMenuItems().find((item) => item.id === this._selectedPane)
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
