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
  isPremiumFeature?: boolean;
};

export type EditorMenuGroup = AccordionMenuGroup<EditorMenuItem>;

export const ChangeEditorOption: FunctionComponent<ChangeEditorOptionProps> = ({
  application,
  closeOnBlur,
  note,
}) => {
  const [changeEditorMenuOpen, setChangeEditorMenuOpen] = useState(false);
  const [changeEditorMenuVisible, setChangeEditorMenuVisible] = useState(false);
  const [changeEditorMenuStyle, setChangeEditorMenuStyle] =
    useState<SubmenuStyle>({
      right: 0,
      bottom: 0,
      maxHeight: 'auto',
    });
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

  useEffect(() => {
    setEditorMenuGroups(createEditorMenuGroups(editors));
  }, [editors]);

  useEffect(() => {
    setSelectedEditor(application.componentManager.editorForNote(note));
  }, [application, note]);

  const toggleChangeEditorMenu = () => {
    if (!changeEditorMenuOpen) {
      const menuPosition = calculateSubmenuStyle(changeEditorButtonRef.current);
      if (menuPosition) {
        setChangeEditorMenuStyle(menuPosition);
      }
    }

    setChangeEditorMenuOpen(!changeEditorMenuOpen);
  };

  useEffect(() => {
    if (changeEditorMenuOpen) {
      setTimeout(() => {
        const newMenuPosition = calculateSubmenuStyle(
          changeEditorButtonRef.current,
          changeEditorMenuRef.current
        );

        if (newMenuPosition) {
          setChangeEditorMenuStyle(newMenuPosition);
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
          ...changeEditorMenuStyle,
          position: 'fixed',
        }}
        className="sn-dropdown flex flex-col max-h-120 min-w-68 fixed overflow-y-auto"
      >
        <ChangeEditorMenu
          application={application}
          closeOnBlur={closeOnBlur}
          currentEditor={selectedEditor}
          setSelectedEditor={setSelectedEditor}
          note={note}
          groups={editorMenuGroups}
          isOpen={changeEditorMenuVisible}
        />
      </DisclosurePanel>
    </Disclosure>
  );
};
