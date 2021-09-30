import { Listbox, ListboxOption } from '@reach/listbox';
import VisuallyHidden from '@reach/visually-hidden';
import { FunctionComponent } from 'preact';
import { IconType } from './Icon';
import '@reach/listbox/styles.css';
import { useState } from 'preact/hooks';

export type DropdownItem = {
  icon?: IconType;
  label: string;
  value: string;
};

type Props = {
  id: string;
  srLabel: string;
  items: DropdownItem[];
  defaultValue: string;
};

export const Dropdown: FunctionComponent<Props> = ({
  id,
  srLabel,
  items,
  defaultValue,
}) => {
  const [value, setValue] = useState(defaultValue);

  const labelId = `${id}-label`;

  return (
    <>
      <VisuallyHidden id={labelId}>{srLabel}</VisuallyHidden>
      <Listbox
        value={value}
        onChange={(value) => setValue(value)}
        aria-labelledby={labelId}
      >
        {items.map((item) => (
          <ListboxOption value={item.value}>{item.label}</ListboxOption>
        ))}
      </Listbox>
    </>
  );
};
