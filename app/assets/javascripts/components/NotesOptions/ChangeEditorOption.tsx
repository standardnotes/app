import { KeyboardKey } from '@/services/ioService';
import { STRING_EDIT_LOCKED_ATTEMPT } from '@/strings';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import {
  reloadFont,
  transactionForAssociateComponentWithCurrentNote,
  transactionForDisassociateComponentWithCurrentNote,
} from '@/views/note_view/note_view';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import {
  ComponentArea,
  ItemMutator,
  NoteMutator,
  PrefKey,
  SNComponent,
  SNNote,
  TransactionalMutation,
} from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon, IconType } from '../Icon';
import { PremiumModalProvider } from '../Premium';
import { useCloseOnBlur } from '../utils';
import { createEditorMenuGroups } from './changeEditor/createEditorMenuGroups';
import { EditorAccordionMenu } from './changeEditor/EditorAccordionMenu';

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
  isPremiumFeature?: boolean;
};

export type EditorMenuGroup = AccordionMenuGroup<EditorMenuItem>;

export const ChangeEditorOption: FunctionComponent<ChangeEditorOptionProps> = ({
  application,
  appState,
  note,
}) => {
  const [changeEditorMenuOpen, setChangeEditorMenuOpen] = useState(false);
  const [changeEditorMenuPosition, setChangeEditorMenuPosition] = useState<{
    top?: number | 'auto';
    right?: number | 'auto';
    bottom: number | 'auto';
    left?: number | 'auto';
  }>({
    right: 0,
    bottom: 0,
  });
  const changeEditorMenuRef = useRef<HTMLDivElement>(null);
  const changeEditorButtonRef = useRef<HTMLButtonElement>(null);
  const [closeEditorMenuOnBlur] = useCloseOnBlur(
    changeEditorMenuRef,
    setChangeEditorMenuOpen
  );
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
    const defaultFontSize = window.getComputedStyle(
      document.documentElement
    ).fontSize;
    const maxChangeEditorMenuSize = parseFloat(defaultFontSize) * 30;
    const { clientWidth, clientHeight } = document.documentElement;
    const buttonRect = changeEditorButtonRef.current?.getBoundingClientRect();
    const buttonParentRect =
      changeEditorButtonRef.current?.parentElement?.getBoundingClientRect();
    const footerHeightInPx = 32;

    if (buttonRect && buttonParentRect) {
      let positionBottom =
        clientHeight - buttonRect.bottom - buttonRect.height / 2;

      if (positionBottom < footerHeightInPx) {
        positionBottom = footerHeightInPx + 5;
      }

      if (buttonRect.right + maxChangeEditorMenuSize > clientWidth) {
        setChangeEditorMenuPosition({
          bottom: positionBottom,
          right: clientWidth - buttonRect.left,
        });
      } else {
        setChangeEditorMenuPosition({
          bottom: positionBottom,
          left: buttonRect.right,
        });
      }
    }

    setChangeEditorMenuOpen(!changeEditorMenuOpen);
  };

  useEffect(() => {
    if (changeEditorMenuOpen) {
      const changeEditorMenuBoundingRect =
        changeEditorMenuRef.current?.getBoundingClientRect();

      if (changeEditorMenuBoundingRect) {
        if (changeEditorMenuBoundingRect.y < 5) {
          setChangeEditorMenuPosition({
            ...changeEditorMenuPosition,
            top: 5,
            bottom: 'auto',
          });
        }
      }
    }
  }, [changeEditorMenuOpen, changeEditorMenuPosition]);

  const selectComponent = async (component: SNComponent | null) => {
    if (component) {
      if (component.conflictOf) {
        application.changeAndSaveItem(component.uuid, (mutator) => {
          mutator.conflictOf = undefined;
        });
      }
    }

    const transactions: TransactionalMutation[] = [];

    if (appState.getActiveNoteController()?.isTemplateNote) {
      await appState.getActiveNoteController().insertTemplatedNote();
    }

    if (note.locked) {
      application.alertService.alert(STRING_EDIT_LOCKED_ATTEMPT);
      return;
    }

    if (!component) {
      if (!note.prefersPlainEditor) {
        transactions.push({
          itemUuid: note.uuid,
          mutate: (m: ItemMutator) => {
            const noteMutator = m as NoteMutator;
            noteMutator.prefersPlainEditor = true;
          },
        });
      }
      const currentEditor = application.componentManager.editorForNote(note);
      if (currentEditor?.isExplicitlyEnabledForItem(note.uuid)) {
        transactions.push(
          transactionForDisassociateComponentWithCurrentNote(
            currentEditor,
            note
          )
        );
      }
      reloadFont(application.getPreference(PrefKey.EditorMonospaceEnabled));
    } else if (component.area === ComponentArea.Editor) {
      const currentEditor = application.componentManager.editorForNote(note);
      if (currentEditor && component.uuid !== currentEditor.uuid) {
        transactions.push(
          transactionForDisassociateComponentWithCurrentNote(
            currentEditor,
            note
          )
        );
      }
      const prefersPlain = note.prefersPlainEditor;
      if (prefersPlain) {
        transactions.push({
          itemUuid: note.uuid,
          mutate: (m: ItemMutator) => {
            const noteMutator = m as NoteMutator;
            noteMutator.prefersPlainEditor = false;
          },
        });
      }
      transactions.push(
        transactionForAssociateComponentWithCurrentNote(component, note)
      );
    }

    await application.runTransactionalMutations(transactions);
    /** Dirtying can happen above */
    application.sync();

    setSelectedEditor(application.componentManager.editorForNote(note));
  };

  return (
    <Disclosure open={changeEditorMenuOpen} onChange={toggleChangeEditorMenu}>
      <DisclosureButton
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            setChangeEditorMenuOpen(false);
          }
        }}
        onBlur={closeEditorMenuOnBlur}
        ref={changeEditorButtonRef}
        className="sn-dropdown-item justify-between"
      >
        <div className="flex items-center">
          <Icon type="editor" className="color-neutral mr-2" />
          Change editor
        </div>
        <Icon type="chevron-right" className="color-neutral" />
      </DisclosureButton>
      <DisclosurePanel
        ref={changeEditorMenuRef}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setChangeEditorMenuOpen(false);
            changeEditorButtonRef.current?.focus();
          }
        }}
        style={{
          ...changeEditorMenuPosition,
          position: 'fixed',
        }}
        className="sn-dropdown min-w-80 flex flex-col py-2 max-h-120 max-w-xs fixed overflow-y-auto"
      >
        <PremiumModalProvider state={appState.features}>
          <EditorAccordionMenu
            groups={editorMenuGroups}
            selectedEditor={selectedEditor}
            selectComponent={selectComponent}
          />
        </PremiumModalProvider>
      </DisclosurePanel>
    </Disclosure>
  );
};
