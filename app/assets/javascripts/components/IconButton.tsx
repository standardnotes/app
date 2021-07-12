import { FunctionComponent } from 'preact';
import { Icon, IconType } from './Icon';

const ICON_BUTTON_TYPES: {
  [type: string]: { className: string };
} = {
  normal: {
    className: '',
  },
  primary: {
    className: 'info',
  },
};

export type IconButtonType = keyof typeof ICON_BUTTON_TYPES;

interface IconButtonProps {
  /**
   * onClick - preventDefault is handled within the component
   */
  onClick: () => void;

  type: IconButtonType;

  className?: string;

  iconType: IconType;
}

/**
 * CircleButton component with an icon for SPA
 * preventDefault is already handled within the component
 */
export const IconButton: FunctionComponent<IconButtonProps> = ({
  onClick,
  type,
  className,
  iconType,
}) => {
  const click = (e: MouseEvent) => {
    e.preventDefault();
    onClick();
  };
  const typeProps = ICON_BUTTON_TYPES[type];
  return (
    <button
      className={`sn-icon-button ${typeProps.className} ${className ?? ''}`}
      onClick={click}
    >
      <Icon type={iconType} />
    </button>
  );
};
