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
import '@reach/listbox/styles.css';
import { useState } from 'preact/hooks';

export type DropdownItem = {
  icon?: IconType;
  label: string;
  value: string;
};

type DropdownProps = {
  id: string;
  srLabel: string;
  items: DropdownItem[];
  defaultValue: string;
  onChange: (value: string) => void;
};

type ListboxButtonProps = {
  value: string | null;
  label: string;
  isExpanded: boolean;
};

const customDropdownButton: FunctionComponent<ListboxButtonProps> = ({
  label,
  isExpanded,
}) => (
  <>
    <div className="dropdown-selected-label">{label}</div>
    <ListboxArrow
      className={`sn-dropdown-arrow ${
        isExpanded ? 'dropdown-arrow-rotated' : ''
      }`}
    >
      <Icon type="menu-arrow-down" className="sn-icon--small color-grey-1" />
    </ListboxArrow>
  </>
);

export const Dropdown: FunctionComponent<DropdownProps> = ({
  id,
  srLabel,
  items,
  defaultValue,
  onChange,
}) => {
  const [value, setValue] = useState(defaultValue);

  const labelId = `${id}-label`;

  const handleChange = (value: string) => {
    setValue(value);
    onChange(value);
  };

  return (
    <>
      <VisuallyHidden id={labelId}>{srLabel}</VisuallyHidden>
      <ListboxInput
        value={value}
        onChange={handleChange}
        aria-labelledby={labelId}
      >
        <ListboxButton
          className="sn-dropdown-button"
          children={customDropdownButton}
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
                      <Icon type={item.icon} className="sn-icon--small" />
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
