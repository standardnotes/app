import { Icon } from '@/components/Icon';
import { MenuItem, MenuItemType } from '@/components/Menu/MenuItem';
import { KeyboardKey } from '@/services/ioService';
import { ApplicationDescriptor } from '@standardnotes/snjs/dist/@types';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

type Props = {
  descriptor: ApplicationDescriptor;
  onClick: () => void;
  renameDescriptor: (label: string) => void;
};

export const WorkspaceMenuItem: FunctionComponent<Props> = ({
  descriptor,
  onClick,
  renameDescriptor,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
    }
  }, [isRenaming]);

  const handleInputKeyDown = (event: KeyboardEvent) => {
    if (event.key === KeyboardKey.Enter) {
      inputRef.current?.blur();
    }
  };

  const handleInputBlur = (event: FocusEvent) => {
    const name = (event.target as HTMLInputElement).value;
    renameDescriptor(name);
    setIsRenaming(false);
  };

  return (
    <MenuItem
      type={MenuItemType.RadioButton}
      className="sn-dropdown-item py-2 focus:bg-info-backdrop focus:shadow-none"
      onClick={onClick}
      checked={descriptor.primary}
    >
      <div className="flex items-center justify-between w-full">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={descriptor.label}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
          />
        ) : (
          <div>{descriptor.label}</div>
        )}
        <button
          className="w-5 h-5 p-0 border-0 bg-transparent hover:bg-contrast cursor-pointer"
          onClick={() => {
            setIsRenaming((isRenaming) => !isRenaming);
          }}
        >
          <Icon type="pencil" className="sn-icon--mid color-neutral" />
        </button>
      </div>
    </MenuItem>
  );
};
