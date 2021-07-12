import { Icon, IconType } from '@/components/Icon';
import { FunctionComponent } from 'preact';

interface PreferencesMenuItemProps {
  iconType: IconType;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export const PreferencesMenuItem: FunctionComponent<PreferencesMenuItemProps> =
  ({ iconType, label, selected, onClick }) => (
    <div
      className={`preferences-menu-item ${selected ? 'selected' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <Icon className="icon" type={iconType} />
      {label}
    </div>
  );
