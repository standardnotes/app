import { KeyboardKey } from '@/services/ioService';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import {
  ComponentArea,
  IconType,
  SNComponent,
  SNNote,
} from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../Icon';
import { createEditorMenuGroups } from './changeEditor/createEditorMenuGroups';
import { ChangeEditorMenu } from './changeEditor/ChangeEditorMenu';
import {
  calculateSubmenuStyle,
  SubmenuStyle,
} from '@/utils/calculateSubmenuStyle';
import { useCloseOnBlur } from '../utils';

type ChangeEditorOptionProps = {
  appState: AppState;
  application: WebApplication;
  note: SNNote;
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
  note,
}) => {
  const [changeEditorMenuOpen, setChangeEditorMenuOpen] = useState(false);
  const [changeEditorMenuVisible, setChangeEditorMenuVisible] = useState(false);
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>({
    right: 0,
    bottom: 0,
    maxHeight: 'auto',
  });
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const changeEditorMenuRef = useRef<HTMLDivElement>(null);
  const changeEditorButtonRef = useRef<HTMLButtonElement>(null);
  const [editors] = useState<SNComponent[]>(() =>
    application.componentManager
      .componentsForArea(ComponentArea.Editor)
      .sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      })
  );
  const [editorMenuGroups, setEditorMenuGroups] = useState<EditorMenuGroup[]>(
    []
  );
  const [selectedEditor, setSelectedEditor] = useState(() =>
    application.componentManager.editorForNote(note)
  );
  const [closeOnBlur] = useCloseOnBlur(menuContainerRef, (open: boolean) => {
    setChangeEditorMenuOpen(open);
    setChangeEditorMenuVisible(open);
  });

  useEffect(() => {
    setEditorMenuGroups(createEditorMenuGroups(application, editors));
  }, [application, editors]);

  useEffect(() => {
    setSelectedEditor(application.componentManager.editorForNote(note));
  }, [application, note]);

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
    <div ref={menuContainerRef}>
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
              currentEditor={selectedEditor}
              setSelectedEditor={setSelectedEditor}
              note={note}
              groups={editorMenuGroups}
              isOpen={changeEditorMenuVisible}
              closeMenu={() => {
                setChangeEditorMenuOpen(false);
              }}
            />
          )}
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
};
