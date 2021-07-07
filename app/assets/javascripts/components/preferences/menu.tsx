import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { PreferencesMenuItem } from '../PreferencesMenuItem';
import { MockState } from './mock-state';

interface PreferencesMenuProps {
  store: MockState;
}

export const PreferencesMenu: FunctionComponent<PreferencesMenuProps> =
  observer(({ store }) => (
    <div className="flex flex-col px-3 py-6 overflow-y-auto">
      {store.items.map((pref) => (
        <PreferencesMenuItem
          key={pref.id}
          iconType={pref.icon}
          label={pref.label}
          selected={pref.selected}
          onClick={() => store.select(pref.id)}
        />
      ))}
    </div>
  ));
