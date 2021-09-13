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
}) => {
  const click = (e: MouseEvent) => {
    e.preventDefault();
    onClick();
  };
  return (
    <button
      title={title}
      className={`no-border cursor-pointer bg-transparent hover:brightness-130 p-0 ${className}`}
      onClick={click}
    >
      <Icon type={icon} />
    </button>
  );
};
