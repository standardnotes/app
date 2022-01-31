import { Icon } from '@/components/Icon';
import { FunctionComponent } from 'preact';
import { IconType } from '@standardnotes/snjs';

interface Props {
  iconType: IconType;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export const MenuItem: FunctionComponent<Props> = ({
  iconType,
  label,
  selected,
  onClick,
}) => (
  <div
    className={`preferences-menu-item select-none ${
      selected ? 'selected' : ''
    }`}
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
  >
    <Icon className="icon" type={iconType} />
    <div className="min-w-1" />
    {label}
  </div>
);
