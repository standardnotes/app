import { Icon } from '@/components/Icon';
import { Menu } from '@/components/menu/Menu';
import { MenuItem, MenuItemType } from '@/components/menu/MenuItem';
import {
  reloadFont,
  transactionForAssociateComponentWithCurrentNote,
  transactionForDisassociateComponentWithCurrentNote,
} from '@/components/NoteView/NoteView';
import { usePremiumModal } from '@/components/Premium';
import { STRING_EDIT_LOCKED_ATTEMPT } from '@/strings';
import { WebApplication } from '@/ui_models/application';
import {
  ComponentArea,
  ItemMutator,
  NoteMutator,
  PrefKey,
  SNComponent,
  SNNote,
  TransactionalMutation,
} from '@standardnotes/snjs';
import { Fragment, FunctionComponent } from 'preact';
import { StateUpdater, useCallback } from 'preact/hooks';
import { EditorMenuItem, EditorMenuGroup } from '../ChangeEditorOption';
import { PLAIN_EDITOR_NAME } from './createEditorMenuGroups';

type ChangeEditorMenuProps = {
  application: WebApplication;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
  closeMenu: () => void;
  groups: EditorMenuGroup[];
  isOpen: boolean;
  currentEditor: SNComponent | undefined;
  note: SNNote;
  setSelectedEditor: StateUpdater<SNComponent | undefined>;
};

const getGroupId = (group: EditorMenuGroup) =>
  group.title.toLowerCase().replace(/\s/, '-');

export const ChangeEditorMenu: FunctionComponent<ChangeEditorMenuProps> = ({
  application,
  closeOnBlur,
  closeMenu,
  groups,
  isOpen,
  currentEditor,
  setSelectedEditor,
  note,
}) => {
  const premiumModal = usePremiumModal();

  const isSelectedEditor = useCallback(
    (item: EditorMenuItem) => {
      if (currentEditor) {
        if (item?.component?.identifier === currentEditor.identifier) {
          return true;
        }
      } else if (item.name === PLAIN_EDITOR_NAME) {
        return true;
      }
      return false;
    },
    [currentEditor]
  );

  const selectComponent = async (
    component: SNComponent | null,
    note: SNNote
  ) => {
    if (component) {
      if (component.conflictOf) {
        application.changeAndSaveItem(component.uuid, (mutator) => {
          mutator.conflictOf = undefined;
        });
      }
    }

    const transactions: TransactionalMutation[] = [];

    if (application.getAppState().getActiveNoteController()?.isTemplateNote) {
      await application
        .getAppState()
        .getActiveNoteController()
        .insertTemplatedNote();
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

  const selectEditor = async (itemToBeSelected: EditorMenuItem) => {
    if (!itemToBeSelected.isEntitled) {
      premiumModal.activate(itemToBeSelected.name);
      return;
    }

    const areBothEditorsPlain = !currentEditor && !itemToBeSelected.component;

    if (areBothEditorsPlain) {
      return;
    }

    let shouldSelectEditor = true;

    if (itemToBeSelected.component) {
      const changeRequiresAlert =
        application.componentManager.doesEditorChangeRequireAlert(
          currentEditor,
          itemToBeSelected.component
        );

      if (changeRequiresAlert) {
        shouldSelectEditor =
          await application.componentManager.showEditorChangeAlert();
      }
    }

    if (shouldSelectEditor) {
      selectComponent(itemToBeSelected.component ?? null, note);
    }

    closeMenu();
  };

  return (
    <Menu
      className="pt-0.5 pb-1"
      a11yLabel="Change editor menu"
      isOpen={isOpen}
    >
      {groups
        .filter((group) => group.items && group.items.length)
        .map((group, index) => {
          const groupId = getGroupId(group);

          return (
            <Fragment key={groupId}>
              <div
                className={`flex items-center px-2.5 py-2 text-xs font-semibold color-text border-0 border-y-1px border-solid border-main ${
                  index === 0 ? 'border-t-0 mb-2' : 'my-2'
                }`}
              >
                {group.icon && (
                  <Icon
                    type={group.icon}
                    className={`mr-2 ${group.iconClassName}`}
                  />
                )}
                <div className="font-semibold text-input">{group.title}</div>
              </div>
              {group.items.map((item) => {
                const onClickEditorItem = () => {
                  selectEditor(item);
                };

                return (
                  <MenuItem
                    type={MenuItemType.RadioButton}
                    onClick={onClickEditorItem}
                    className={`sn-dropdown-item py-2 text-input focus:bg-info-backdrop focus:shadow-none`}
                    onBlur={closeOnBlur}
                    checked={isSelectedEditor(item)}
                  >
                    <div className="flex flex-grow items-center justify-between">
                      {item.name}
                      {!item.isEntitled && <Icon type="premium-feature" />}
                    </div>
                  </MenuItem>
                );
              })}
            </Fragment>
          );
        })}
    </Menu>
  );
};
