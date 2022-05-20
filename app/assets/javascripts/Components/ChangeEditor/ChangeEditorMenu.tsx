import { Icon } from '@/Components/Icon'
import { Menu } from '@/Components/Menu/Menu'
import { MenuItem, MenuItemType } from '@/Components/Menu/MenuItem'
import {
  reloadFont,
  transactionForAssociateComponentWithCurrentNote,
  transactionForDisassociateComponentWithCurrentNote,
} from '@/Components/NoteView/NoteView'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { STRING_EDIT_LOCKED_ATTEMPT } from '@/Strings'
import { WebApplication } from '@/UIModels/Application'
import {
  ComponentArea,
  ItemMutator,
  NoteMutator,
  PrefKey,
  SNComponent,
  SNNote,
  TransactionalMutation,
} from '@standardnotes/snjs'
import { Fragment, FunctionComponent } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { EditorMenuItem, EditorMenuGroup } from '@/Components/NotesOptions/ChangeEditorOption'
import { createEditorMenuGroups } from './createEditorMenuGroups'
import { PLAIN_EDITOR_NAME } from '@/Constants'

type ChangeEditorMenuProps = {
  application: WebApplication
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
  closeMenu: () => void
  isVisible: boolean
  note: SNNote
}

const getGroupId = (group: EditorMenuGroup) => group.title.toLowerCase().replace(/\s/, '-')

export const ChangeEditorMenu: FunctionComponent<ChangeEditorMenuProps> = ({
  application,
  closeOnBlur,
  closeMenu,
  isVisible,
  note,
}) => {
  const [editors] = useState<SNComponent[]>(() =>
    application.componentManager.componentsForArea(ComponentArea.Editor).sort((a, b) => {
      return a.displayName.toLowerCase() < b.displayName.toLowerCase() ? -1 : 1
    }),
  )
  const [groups, setGroups] = useState<EditorMenuGroup[]>([])
  const [currentEditor, setCurrentEditor] = useState<SNComponent>()

  useEffect(() => {
    setGroups(createEditorMenuGroups(application, editors))
  }, [application, editors])

  useEffect(() => {
    if (note) {
      setCurrentEditor(application.componentManager.editorForNote(note))
    }
  }, [application, note])

  const premiumModal = usePremiumModal()

  const isSelectedEditor = useCallback(
    (item: EditorMenuItem) => {
      if (currentEditor) {
        if (item?.component?.identifier === currentEditor.identifier) {
          return true
        }
      } else if (item.name === PLAIN_EDITOR_NAME) {
        return true
      }
      return false
    },
    [currentEditor],
  )

  const selectComponent = async (component: SNComponent | null, note: SNNote) => {
    if (component) {
      if (component.conflictOf) {
        application.mutator
          .changeAndSaveItem(component, (mutator) => {
            mutator.conflictOf = undefined
          })
          .catch(console.error)
      }
    }

    const transactions: TransactionalMutation[] = []

    await application.getAppState().contentListView.insertCurrentIfTemplate()

    if (note.locked) {
      application.alertService.alert(STRING_EDIT_LOCKED_ATTEMPT).catch(console.error)
      return
    }

    if (!component) {
      if (!note.prefersPlainEditor) {
        transactions.push({
          itemUuid: note.uuid,
          mutate: (m: ItemMutator) => {
            const noteMutator = m as NoteMutator
            noteMutator.prefersPlainEditor = true
          },
        })
      }
      const currentEditor = application.componentManager.editorForNote(note)
      if (currentEditor?.isExplicitlyEnabledForItem(note.uuid)) {
        transactions.push(transactionForDisassociateComponentWithCurrentNote(currentEditor, note))
      }
      reloadFont(application.getPreference(PrefKey.EditorMonospaceEnabled))
    } else if (component.area === ComponentArea.Editor) {
      const currentEditor = application.componentManager.editorForNote(note)
      if (currentEditor && component.uuid !== currentEditor.uuid) {
        transactions.push(transactionForDisassociateComponentWithCurrentNote(currentEditor, note))
      }
      const prefersPlain = note.prefersPlainEditor
      if (prefersPlain) {
        transactions.push({
          itemUuid: note.uuid,
          mutate: (m: ItemMutator) => {
            const noteMutator = m as NoteMutator
            noteMutator.prefersPlainEditor = false
          },
        })
      }
      transactions.push(transactionForAssociateComponentWithCurrentNote(component, note))
    }

    await application.mutator.runTransactionalMutations(transactions)
    /** Dirtying can happen above */
    application.sync.sync().catch(console.error)

    setCurrentEditor(application.componentManager.editorForNote(note))
  }

  const selectEditor = async (itemToBeSelected: EditorMenuItem) => {
    if (!itemToBeSelected.isEntitled) {
      premiumModal.activate(itemToBeSelected.name)
      return
    }

    const areBothEditorsPlain = !currentEditor && !itemToBeSelected.component

    if (areBothEditorsPlain) {
      return
    }

    let shouldSelectEditor = true

    if (itemToBeSelected.component) {
      const changeRequiresAlert = application.componentManager.doesEditorChangeRequireAlert(
        currentEditor,
        itemToBeSelected.component,
      )

      if (changeRequiresAlert) {
        shouldSelectEditor = await application.componentManager.showEditorChangeAlert()
      }
    }

    if (shouldSelectEditor) {
      selectComponent(itemToBeSelected.component ?? null, note).catch(console.error)
    }

    closeMenu()
  }

  return (
    <Menu className="pt-0.5 pb-1" a11yLabel="Change note type menu" isOpen={isVisible}>
      {groups
        .filter((group) => group.items && group.items.length)
        .map((group, index) => {
          const groupId = getGroupId(group)

          return (
            <Fragment key={groupId}>
              <div className={`py-1 border-0 border-t-1px border-solid border-main ${index === 0 ? 'border-t-0' : ''}`}>
                {group.items.map((item) => {
                  const onClickEditorItem = () => {
                    selectEditor(item).catch(console.error)
                  }
                  return (
                    <MenuItem
                      type={MenuItemType.RadioButton}
                      onClick={onClickEditorItem}
                      className={
                        'sn-dropdown-item py-2 text-input focus:bg-info-backdrop focus:shadow-none flex-row-reverse'
                      }
                      onBlur={closeOnBlur}
                      checked={isSelectedEditor(item)}
                    >
                      <div className="flex flex-grow items-center justify-between">
                        <div className="flex items-center">
                          {group.icon && <Icon type={group.icon} className={`mr-2 ${group.iconClassName}`} />}
                          {item.name}
                        </div>
                        {!item.isEntitled && <Icon type="premium-feature" />}
                      </div>
                    </MenuItem>
                  )
                })}
              </div>
            </Fragment>
          )
        })}
    </Menu>
  )
}
