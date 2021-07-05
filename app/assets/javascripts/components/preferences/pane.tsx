import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { PreferencesMenuItem } from '../PreferencesMenuItem';
import { MockState } from './mock-state';

interface PreferencesMenuProps {
  store: MockState;
}

const PreferencesMenu: FunctionComponent<PreferencesMenuProps> = observer(
  ({ store }) => (
    <div className="h-full w-auto flex flex-col px-3 py-6">
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
  )
);

export const PreferencesPane: FunctionComponent = () => {
  const store = new MockState();
  return (
    <div className="h-full w-full flex flex-row">
      <PreferencesMenu store={store}></PreferencesMenu>
    </div>
  );
};
