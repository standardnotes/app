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
  const [changeEditorMenuOpen, setChangeEditorMenuOpen] = useState(false);
  const [changeEditorMenuVisible, setChangeEditorMenuVisible] = useState(false);
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>({
    right: 0,
    bottom: 0,
    maxHeight: 'auto',
  });
  const changeEditorMenuRef = useRef<HTMLDivElement>(null);
  const changeEditorButtonRef = useRef<HTMLButtonElement>(null);

  const toggleChangeEditorMenu = () => {
    if (!changeEditorMenuOpen) {
      const menuStyle = calculateSubmenuStyle(changeEditorButtonRef.current);
      if (menuStyle) {
        setMenuStyle(menuStyle);
      }
    }

    setChangeEditorMenuOpen(!changeEditorMenuOpen);
  };

  useEffect(() => {
    if (changeEditorMenuOpen) {
      setTimeout(() => {
        const newMenuStyle = calculateSubmenuStyle(
          changeEditorButtonRef.current,
          changeEditorMenuRef.current
        );

        if (newMenuStyle) {
          setMenuStyle(newMenuStyle);
          setChangeEditorMenuVisible(true);
        }
      });
    }
  }, [changeEditorMenuOpen]);

  return (
    <Disclosure open={changeEditorMenuOpen} onChange={toggleChangeEditorMenu}>
      <DisclosureButton
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            setChangeEditorMenuOpen(false);
          }
        }}
        onBlur={closeOnBlur}
        ref={changeEditorButtonRef}
        className="sn-dropdown-item justify-between"
      >
        <div className="flex items-center">
          <Icon type="dashboard" className="color-neutral mr-2" />
          Change editor
        </div>
        <Icon type="chevron-right" className="color-neutral" />
      </DisclosureButton>
      <DisclosurePanel
        ref={changeEditorMenuRef}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            setChangeEditorMenuOpen(false);
            changeEditorButtonRef.current?.focus();
          }
        }}
        style={{
          ...menuStyle,
          position: 'fixed',
        }}
        className="sn-dropdown flex flex-col max-h-120 min-w-68 fixed overflow-y-auto"
      >
        {changeEditorMenuOpen && (
          <ChangeEditorMenu
            application={application}
            closeOnBlur={closeOnBlur}
            note={note}
            isOpen={changeEditorMenuVisible}
            closeMenu={() => {
              setChangeEditorMenuOpen(false);
            }}
          />
        )}
      </DisclosurePanel>
    </Disclosure>
  );
};
