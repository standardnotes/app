import { KeyboardKey } from '@/services/ioService';
import { STRING_EDIT_LOCKED_ATTEMPT } from '@/strings';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import {
  MENU_MARGIN_FROM_APP_BORDER,
  MAX_MENU_SIZE_MULTIPLIER,
} from '@/views/constants';
import {
  reloadFont,
  transactionForAssociateComponentWithCurrentNote,
  transactionForDisassociateComponentWithCurrentNote,
} from '@/components/NoteView/NoteView';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import {
  ComponentArea,
  IconType,
  ItemMutator,
  NoteMutator,
  PrefKey,
  SNComponent,
  SNNote,
  TransactionalMutation,
} from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../Icon';
import { createEditorMenuGroups } from './changeEditor/createEditorMenuGroups';
import { EditorAccordionMenu } from './changeEditor/EditorAccordionMenu';

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

type MenuPositionStyle = {
  top?: number | 'auto';
  right?: number | 'auto';
  bottom: number | 'auto';
  left?: number | 'auto';
};

const calculateMenuPosition = (
  button: HTMLButtonElement | null,
  menu?: HTMLDivElement | null
): MenuPositionStyle | undefined => {
  const defaultFontSize = window.getComputedStyle(
    document.documentElement
  ).fontSize;

  const maxChangeEditorMenuSize =
    parseFloat(defaultFontSize) * MAX_MENU_SIZE_MULTIPLIER;

  const { clientWidth, clientHeight } = document.documentElement;

  const buttonRect = button?.getBoundingClientRect();

  const buttonParentRect = button?.parentElement?.getBoundingClientRect();

  const menuBoundingRect = menu?.getBoundingClientRect();

  const footerElementRect = document
    .getElementById('footer-bar')
    ?.getBoundingClientRect();

  const footerHeightInPx = footerElementRect?.height ?? 0;

  let position: MenuPositionStyle = {
    bottom: 'auto',
  };

  if (buttonRect && buttonParentRect) {
    let positionBottom =
      clientHeight - buttonRect.bottom - buttonRect.height / 2;

    if (positionBottom < footerHeightInPx) {
      positionBottom = footerHeightInPx + MENU_MARGIN_FROM_APP_BORDER;
    }

    if (buttonRect.right + maxChangeEditorMenuSize > clientWidth) {
      position = {
        bottom: positionBottom,
        right: clientWidth - buttonRect.left,
      };
    } else {
      position = {
        bottom: positionBottom,
        left: buttonRect.right,
      };
    }
  }

  if (menuBoundingRect && menuBoundingRect.height && buttonRect) {
    if (menuBoundingRect.y < MENU_MARGIN_FROM_APP_BORDER) {
      if (
        buttonRect.right + maxChangeEditorMenuSize >
        document.documentElement.clientWidth
      ) {
        return {
          ...position,
          top: MENU_MARGIN_FROM_APP_BORDER + buttonRect.top - buttonRect.height,
          bottom: 'auto',
        };
      } else {
        return {
          ...position,
          top: MENU_MARGIN_FROM_APP_BORDER,
          bottom: 'auto',
        };
      }
    }
  }

  return position;
};

const TIME_IN_MS_TO_WAIT_BEFORE_REPAINT = 1;

export const ChangeEditorOption: FunctionComponent<ChangeEditorOptionProps> = ({
  application,
  appState,
  closeOnBlur,
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
    const maxChangeEditorMenuSize =
      parseFloat(defaultFontSize) * MAX_MENU_SIZE_MULTIPLIER;
    const { clientWidth, clientHeight } = document.documentElement;
    const buttonRect = changeEditorButtonRef.current?.getBoundingClientRect();
    const buttonParentRect =
      changeEditorButtonRef.current?.parentElement?.getBoundingClientRect();
    const footerElementRect = document
      .getElementById('footer-bar')
      ?.getBoundingClientRect();
    const footerHeightInPx = footerElementRect?.height;

    if (buttonRect && buttonParentRect && footerHeightInPx) {
      let positionBottom =
        clientHeight - buttonRect.bottom - buttonRect.height / 2;

      if (positionBottom < footerHeightInPx) {
        positionBottom = footerHeightInPx + MENU_MARGIN_FROM_APP_BORDER;
      }

      if (buttonRect.right + maxChangeEditorMenuSize > clientWidth) {
        setChangeEditorMenuPosition({
          top: positionBottom - buttonParentRect.height / 2,
          right: clientWidth - buttonRect.left,
          bottom: 'auto',
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
      setTimeout(() => {
        const newMenuPosition = calculateMenuPosition(
          changeEditorButtonRef.current,
          changeEditorMenuRef.current
        );

        if (newMenuPosition) {
          setChangeEditorMenuPosition(newMenuPosition);
        }
      }, TIME_IN_MS_TO_WAIT_BEFORE_REPAINT);
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
        onBlur={closeOnBlur}
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
          if (event.key === KeyboardKey.Escape) {
            setChangeEditorMenuOpen(false);
            changeEditorButtonRef.current?.focus();
          }
        }}
        style={{
          ...changeEditorMenuPosition,
          position: 'fixed',
        }}
        className="sn-dropdown flex flex-col max-h-120 min-w-68 fixed overflow-y-auto"
      >
        <EditorAccordionMenu
          application={application}
          closeOnBlur={closeOnBlur}
          currentEditor={selectedEditor}
          groups={editorMenuGroups}
          isOpen={changeEditorMenuOpen}
          selectComponent={selectComponent}
        />
      </DisclosurePanel>
    </Disclosure>
  );
};
