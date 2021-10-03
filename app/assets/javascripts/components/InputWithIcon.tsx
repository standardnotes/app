import { FunctionComponent, Ref } from 'preact';
import { JSXInternal } from 'preact/src/jsx';
import { forwardRef } from 'preact/compat';
import { useState } from 'preact/hooks';
import { Icon, IconType } from './Icon';
import { IconButton } from './IconButton';

type Props = {
  icon: IconType;
  inputType: 'text' | 'email' | 'password';
  className?: string;
  iconClassName?: string;
  value: string;
  onChange: JSXInternal.GenericEventHandler<HTMLInputElement>;
  disabled?: boolean;
  placeholder: string;
  toggle?: {
    toggleOnIcon: IconType;
    toggleOffIcon: IconType;
    title: string;
    onClick: (toggled: boolean) => void;
  };
};

export const InputWithIcon: FunctionComponent<Props> = forwardRef(
  (
    {
      icon,
      inputType,
      className,
      iconClassName,
      value,
      onChange,
      disabled,
      toggle,
      placeholder,
    },
    ref: Ref<HTMLInputElement>
  ) => {
    const [toggled, setToggled] = useState(false);

    const handleToggle = (onClick: (toggled: boolean) => void) => {
      onClick(!toggled);
      setToggled(!toggled);
    };

    return (
      <div
        className={`flex items-stretch bg-default border-1 border-solid border-neutral rounded focus-within:ring-info overflow-hidden ${className}`}
      >
        <div className="flex px-2 py-1.5">
          <Icon type={icon} className={`color-grey-1 ${iconClassName}`} />
        </div>
        <input
          type={inputType}
          onChange={onChange}
          value={value}
          className="pr-2 w-full border-0 focus:shadow-none"
          disabled={disabled}
          placeholder={placeholder}
          ref={ref}
        />
        {toggle ? (
          <div className="flex px-2 py-1.5">
            <IconButton
              icon={toggled ? toggle.toggleOnIcon : toggle.toggleOffIcon}
              iconClassName="sn-icon--small"
              title={toggle.title}
              onClick={() => handleToggle(toggle.onClick)}
              focusable={true}
            />
          </div>
        ) : null}
      </div>
    );
  }
);
