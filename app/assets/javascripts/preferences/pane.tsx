import { Icon, IconType } from '@/components/Icon';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { MockState } from './mock-state';

interface MenuItemProps {
  iconType: IconType;
  label: string;
  selected: boolean;
  onClick: () => void;
}

const MenuItem: FunctionComponent<MenuItemProps> = ({
  iconType,
  label,
  selected,
  onClick,
}) => (
  <div
    className={`menu-item ${selected ? 'selected' : ''}`}
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
  >
    <Icon className="icon" type={iconType} />
    {label}
  </div>
);

interface PreferencesMenuProps {
  store: MockState;
}

const PreferencesMenu: FunctionComponent<PreferencesMenuProps> = observer(
  ({ store }) => (
    <div className="preferences-menu">
      {store.items.map((pref) => (
        <MenuItem
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
    <div className="preferences-pane">
      <PreferencesMenu store={store}></PreferencesMenu>
    </div>
  );
};
