import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { MenuItem } from './components';
import { PreferencesMenu } from './preferences-menu';

export const PreferencesMenuView: FunctionComponent<{
  menu: PreferencesMenu;
}> = observer(({ menu }) => (
  <div className="min-w-55 overflow-y-auto flex flex-col px-3 py-6">
    {menu.menuItems.map((pref) => (
      <MenuItem
        key={pref.id}
        iconType={pref.icon}
        label={pref.label}
        selected={pref.selected}
        onClick={() => menu.selectPane(pref.id)}
      />
    ))}
  </div>
));
