import {
  ListboxArrow,
  ListboxButton,
  ListboxInput,
  ListboxList,
  ListboxOption,
  ListboxPopover,
} from '@reach/listbox';
import VisuallyHidden from '@reach/visually-hidden';
import { FunctionComponent } from 'preact';
import { IconType, Icon } from './Icon';
import { useEffect, useState } from 'preact/hooks';

export type DropdownItem = {
  icon?: IconType;
  iconClassName?: string;
  label: string;
  value: string;
};

type DropdownProps = {
  id: string;
  label: string;
  items: DropdownItem[];
  defaultValue: string;
  onChange: (value: string) => void;
};

type ListboxButtonProps = DropdownItem & {
  isExpanded: boolean;
};

const CustomDropdownButton: FunctionComponent<ListboxButtonProps> = ({
  label,
  isExpanded,
  icon,
  iconClassName = '',
}) => (
  <>
    <div className="sn-dropdown-button-label">
      {icon ? (
        <div className="flex mr-2">
          <Icon type={icon} className={`sn-icon--small ${iconClassName}`} />
        </div>
      ) : null}
      <div className="dropdown-selected-label">{label}</div>
    </div>
    <ListboxArrow
      className={`sn-dropdown-arrow ${
        isExpanded ? 'sn-dropdown-arrow-flipped' : ''
      }`}
    >
      <Icon type="menu-arrow-down" className="sn-icon--small color-grey-1" />
    </ListboxArrow>
  </>
);

export const Dropdown: FunctionComponent<DropdownProps> = ({
  id,
  label,
  items,
  defaultValue,
  onChange,
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const labelId = `${id}-label`;

  const handleChange = (value: string) => {
    setValue(value);
    onChange(value);
  };

  return (
    <>
      <VisuallyHidden id={labelId}>{label}</VisuallyHidden>
      <ListboxInput
        value={value}
        onChange={handleChange}
        aria-labelledby={labelId}
      >
        <ListboxButton
          className="sn-dropdown-button"
          children={({ value, label, isExpanded }) => {
            const current = items.find((item) => item.value === value);
            const icon = current ? current?.icon : null;
            const iconClassName = current ? current?.iconClassName : null;
            return CustomDropdownButton({
              value: value ? value : label.toLowerCase(),
              label,
              isExpanded,
              ...(icon ? { icon } : null),
              ...(iconClassName ? { iconClassName } : null),
            });
          }}
        />
        <ListboxPopover className="sn-dropdown sn-dropdown-popover">
          <div className="sn-component">
            <ListboxList>
              {items.map((item) => (
                <ListboxOption
                  className="sn-dropdown-item"
                  value={item.value}
                  label={item.label}
                >
                  {item.icon ? (
                    <div className="flex mr-3">
                      <Icon
                        type={item.icon}
                        className={`sn-icon--small ${item.iconClassName ?? ''}`}
                      />
                    </div>
                  ) : null}
                  <div className="text-input">{item.label}</div>
                </ListboxOption>
              ))}
            </ListboxList>
          </div>
        </ListboxPopover>
      </ListboxInput>
    </>
  );
};
