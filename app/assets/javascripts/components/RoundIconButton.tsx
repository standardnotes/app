import { FunctionComponent } from 'preact';
import { Icon } from './Icon';
import { IconType } from '@standardnotes/snjs';

type ButtonType = 'normal' | 'primary';

interface Props {
  /**
   * onClick - preventDefault is handled within the component
   */
  onClick: () => void;

  type: ButtonType;

  className?: string;

  icon: IconType;
}

/**
 * IconButton component with an icon
 * preventDefault is already handled within the component
 */
export const RoundIconButton: FunctionComponent<Props> = ({
  onClick,
  type,
  className,
  icon: iconType,
}) => {
  const click = (e: MouseEvent) => {
    e.preventDefault();
    onClick();
  };
  const classes = type === 'primary' ? 'info ' : '';
  return (
    <button
      className={`sn-icon-button ${classes} ${className ?? ''}`}
      onClick={click}
    >
      <Icon type={iconType} />
    </button>
  );
};
