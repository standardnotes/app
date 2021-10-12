import { FunctionComponent } from 'preact';
import { Icon, IconType } from './Icon';

interface Props {
  /**
   * onClick - preventDefault is handled within the component
   */
  onClick: () => void;

  className?: string;

  icon: IconType;

  iconClassName?: string;

  /**
   * Button tooltip
   */
  title: string;

  focusable: boolean;

  disabled?: boolean;
}

/**
 * IconButton component with an icon
 * preventDefault is already handled within the component
 */
export const IconButton: FunctionComponent<Props> = ({
  onClick,
  className = '',
  icon,
  title,
  focusable,
  iconClassName = '',
  disabled = false,
}) => {
  const click = (e: MouseEvent) => {
    e.preventDefault();
    onClick();
  };
  const focusableClass = focusable ? '' : 'focus:shadow-none';
  return (
    <button
      title={title}
      className={`no-border cursor-pointer bg-transparent flex flex-row items-center hover:brightness-130 p-0 ${focusableClass} ${className}`}
      onClick={click}
      disabled={disabled}
    >
      <Icon type={icon} className={iconClassName} />
    </button>
  );
};
