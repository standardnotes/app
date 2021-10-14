import { IconType } from '@/components/Icon';
import { makeAutoObservable, observable } from 'mobx';

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

export type PreferenceId = typeof PREFERENCE_IDS[number];
interface PreferencesMenuItem {
  readonly id: PreferenceId;
  readonly icon: IconType;
  readonly label: string;
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

const READY_PREFERENCES_MENU_ITEMS: PreferencesMenuItem[] = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'security', label: 'Security', icon: 'security' },
  { id: 'listed', label: 'Listed', icon: 'listed' },
  { id: 'help-feedback', label: 'Help & feedback', icon: 'help' },
];

export class PreferencesMenu {
  private _selectedPane: PreferenceId = 'general';
  private _menu: PreferencesMenuItem[];

  constructor(
    private readonly _enableUnfinishedFeatures: boolean,
  ) {
    this._menu = this._enableUnfinishedFeatures ? PREFERENCES_MENU_ITEMS : READY_PREFERENCES_MENU_ITEMS;
    makeAutoObservable<PreferencesMenu, '_selectedPane' | '_twoFactorAuth'>(
      this,
      {
        _twoFactorAuth: observable,
        _selectedPane: observable,
      }
    );
  }

  get menuItems(): (PreferencesMenuItem & {
    selected: boolean;
  })[] {
    return this._menu.map((p) => ({
      ...p,
      selected: p.id === this._selectedPane,
    }));
  }

  get selectedPaneId(): PreferenceId {
    return (
      this._menu.find((item) => item.id === this._selectedPane)?.id ?? 'general'
    );
  }

  selectPane(key: PreferenceId): void {
    this._selectedPane = key;
  }
}
