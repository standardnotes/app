import { IconType } from '@/components/Icon';
import { action, computed, makeObservable, observable } from 'mobx';

const PREFERENCE_IDS = [
  'general',
  'account',
  'appearance',
  'security',
  'listed',
  'shortcuts',
  'accessibility',
  'get-free-month',
  'help-feedback',
] as const;

export type PreferenceId = typeof PREFERENCE_IDS[number];
interface PreferenceMenuItem {
  readonly id: PreferenceId;
  readonly icon: IconType;
  readonly label: string;
}

type PreferencesMenu = PreferenceMenuItem[];

/**
 * Items are in order of appearance
 */
const PREFERENCES_MENU: PreferencesMenu = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'appearance', label: 'Appearance', icon: 'themes' },
  { id: 'security', label: 'Security', icon: 'security' },
  { id: 'listed', label: 'Listed', icon: 'listed' },
  { id: 'shortcuts', label: 'Shortcuts', icon: 'keyboard' },
  { id: 'accessibility', label: 'Accessibility', icon: 'accessibility' },
  { id: 'get-free-month', label: 'Get a free month', icon: 'star' },
  { id: 'help-feedback', label: 'Help & feedback', icon: 'help' },
];

export class Preferences {
  private _selectedPane: PreferenceId = 'general';

  constructor(private readonly _menu: PreferencesMenu = PREFERENCES_MENU) {
    makeObservable<Preferences, '_selectedPane'>(this, {
      _selectedPane: observable,
      selectedPaneId: computed,
      menuItems: computed,
      selectPane: action,
    });
  }

  get menuItems(): (PreferenceMenuItem & {
    selected: boolean;
  })[] {
    return this._menu.map((p) => ({
      ...p,
      selected: p.id === this._selectedPane,
    }));
  }

  get selectedPaneId(): PreferenceId {
    return this._menu.find((item) => item.id === this._selectedPane)?.id!;
  }

  selectPane(key: PreferenceId) {
    this._selectedPane = key;
  }
}
