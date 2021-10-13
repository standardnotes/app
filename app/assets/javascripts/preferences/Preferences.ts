import { IconType } from '@/components/Icon';
import { WebApplication } from '@/ui_models/application';
import { ContentType, SNComponent } from '@standardnotes/snjs';
import { action, makeAutoObservable, observable } from 'mobx';
import { ExtensionsLatestVersions } from './panes/extensions-segments';

const PREFERENCE_IDS = [
  'general',
  'account',
  'appearance',
  'security',
  'extensions',
  'listed',
  'shortcuts',
  'accessibility',
  'get-free-month',
  'help-feedback',
] as const;

type ExtensionId = string;

export type PreferenceId = typeof PREFERENCE_IDS[number] | ExtensionId;

interface PreferencesMenuItem {
  readonly id: PreferenceId;
  readonly icon: IconType;
  readonly label: string;
}

interface SelectableMenuItem extends PreferencesMenuItem {
  selected: boolean;
}

/**
 * Items are in order of appearance
 */
const PREFERENCES_MENU_ITEMS: PreferencesMenuItem[] = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'appearance', label: 'Appearance', icon: 'themes' },
  { id: 'security', label: 'Security', icon: 'security' },
  { id: 'extensions', label: 'Extensions', icon: 'tune' },
  { id: 'listed', label: 'Listed', icon: 'listed' },
  { id: 'shortcuts', label: 'Shortcuts', icon: 'keyboard' },
  { id: 'accessibility', label: 'Accessibility', icon: 'accessibility' },
  { id: 'get-free-month', label: 'Get a free month', icon: 'star' },
  { id: 'help-feedback', label: 'Help & feedback', icon: 'help' },
];

export class Preferences {
  private _selectedPane: PreferenceId = 'general';
  private _extensionPanes: SNComponent[] = [];
  private _extensionLatestVersions: ExtensionsLatestVersions = new ExtensionsLatestVersions(new Map());

  constructor(
    private application: WebApplication,
    private readonly _menu: PreferencesMenuItem[] = PREFERENCES_MENU_ITEMS
  ) {
    this.loadExtensionsPanes();
    this.loadLatestVersions();
    makeAutoObservable<Preferences,
      '_selectedPane' | '_twoFactorAuth' | '_extensionPanes' | '_extensionLatestVersions' | 'loadLatestVersions'
    >(
      this,
      {
        _twoFactorAuth: observable,
        _selectedPane: observable,
        _extensionPanes: observable.ref,
        _extensionLatestVersions: observable.ref,
        loadLatestVersions: action,
      }
    );
  }

  private loadLatestVersions(): void {
    ExtensionsLatestVersions.load(this.application).then(versions => {
      this._extensionLatestVersions = versions;
    });
  }

  get extensionsLatestVersions(): ExtensionsLatestVersions {
    return this._extensionLatestVersions;
  }

  loadExtensionsPanes(): void {
    this._extensionPanes = (this.application.getItems([
      ContentType.ActionsExtension,
      ContentType.Component,
      ContentType.Theme,
    ]) as SNComponent[])
      .filter(extension => ['modal', 'rooms'].includes(extension.area));
  }

  get menuItems(): SelectableMenuItem[] {
    const menuItems = this._menu.map((preference) => ({
      ...preference,
      selected: preference.id === this._selectedPane,
    }));
    const extensionsMenuItems: SelectableMenuItem[] = this._extensionPanes
      .map(extension => ({
        icon: 'tune',
        id: extension.package_info.identifier,
        label: extension.name,
        selected: extension.package_info.identifier === this._selectedPane
      }));
    return menuItems.concat(extensionsMenuItems);
  }

  get selectedMenuItem(): PreferencesMenuItem | undefined {
    return this._menu.find((item) => item.id === this._selectedPane);
  }

  get selectedExtension(): SNComponent | undefined {
    return this._extensionPanes.find((extension) =>
      extension.package_info.identifier === this._selectedPane);
  }

  get selectedPaneId(): PreferenceId {
    if (this.selectedMenuItem != undefined) {
      return this.selectedMenuItem.id;
    }

    if (this.selectedExtension != undefined) {
      return this.selectedExtension.package_info.identifier;
    }

    return 'general';
  }

  selectPane(key: PreferenceId): void {
    this._selectedPane = key;
  }
}
