import { KeyboardKey } from '@/services/ioService';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { IconType, SNComponent, SNNote } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../Icon';
import { ChangeEditorMenu } from './changeEditor/ChangeEditorMenu';
import {
  calculateSubmenuStyle,
  SubmenuStyle,
} from '@/utils/calculateSubmenuStyle';

type ChangeEditorOptionProps = {
  appState: AppState;
  application: WebApplication;
  note: SNNote;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

type AccordionMenuGroup<T> = {
  icon?: IconType;
  iconClassName?: string;
  title: string;
  items: Array<T>;
};

export type EditorMenuItem = {
  name: string;
  component?: SNComponent;
  isEntitled: boolean;
};

export type EditorMenuGroup = AccordionMenuGroup<EditorMenuItem>;

export const ChangeEditorOption: FunctionComponent<ChangeEditorOptionProps> = ({
  application,
  closeOnBlur,
  note,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>({
    right: 0,
    bottom: 0,
    maxHeight: 'auto',
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleChangeEditorMenu = () => {
    if (!isOpen) {
      const menuStyle = calculateSubmenuStyle(buttonRef.current);
      if (menuStyle) {
        setMenuStyle(menuStyle);
      }
    }

    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const newMenuStyle = calculateSubmenuStyle(
          buttonRef.current,
          menuRef.current
        );

        if (newMenuStyle) {
          setMenuStyle(newMenuStyle);
          setIsVisible(true);
        }
      });
    }
  }, [isOpen]);

  return (
    <Disclosure open={isOpen} onChange={toggleChangeEditorMenu}>
      <DisclosureButton
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            setIsOpen(false);
          }
        }}
        onBlur={closeOnBlur}
        ref={buttonRef}
        className="sn-dropdown-item justify-between"
      >
        <div className="flex items-center">
          <Icon type="dashboard" className="color-neutral mr-2" />
          Change editor
        </div>
        <Icon type="chevron-right" className="color-neutral" />
      </DisclosureButton>
      <DisclosurePanel
        ref={menuRef}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            setIsOpen(false);
            buttonRef.current?.focus();
          }
        }}
        style={{
          ...menuStyle,
          position: 'fixed',
        }}
        className="sn-dropdown flex flex-col max-h-120 min-w-68 fixed overflow-y-auto"
      >
        {isOpen && (
          <ChangeEditorMenu
            application={application}
            closeOnBlur={closeOnBlur}
            note={note}
            isVisible={isVisible}
            closeMenu={() => {
              setIsOpen(false);
            }}
          />
        )}
      </DisclosurePanel>
    </Disclosure>
  );
};
