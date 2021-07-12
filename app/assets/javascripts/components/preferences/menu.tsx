import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { PreferencesMenuItem } from '../PreferencesMenuItem';
import { Preferences } from './preferences';

interface PreferencesMenuProps {
  preferences: Preferences;
}

export const PreferencesMenu: FunctionComponent<PreferencesMenuProps> =
  observer(({ preferences }) => (
    <div className="min-w-55 overflow-y-auto flex flex-col px-3 py-6">
      {preferences.menuItems.map((pref) => (
        <PreferencesMenuItem
          key={pref.id}
          iconType={pref.icon}
          label={pref.label}
          selected={pref.selected}
          onClick={() => preferences.selectPane(pref.id)}
        />
      ))}
    </div>
  ));
