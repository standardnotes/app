import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { STRING_EDIT_LOCKED_ATTEMPT } from '@/Constants/Strings'
import { WebApplication } from '@/Application/Application'
import {
  ComponentArea,
  ItemMutator,
  NoteMutator,
  NoteType,
  PrefKey,
  SNComponent,
  SNNote,
  TransactionalMutation,
} from '@standardnotes/snjs'
import { Fragment, FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import { EditorMenuGroup } from '@/Components/NotesOptions/EditorMenuGroup'
import { EditorMenuItem } from '@/Components/NotesOptions/EditorMenuItem'
import { createEditorMenuGroups } from './createEditorMenuGroups'
import { PLAIN_EDITOR_NAME } from '@/Constants/Constants'
import { reloadFont } from '../NoteView/FontFunctions'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'

type ChangeEditorMenuProps = {
  application: WebApplication
  closeMenu: () => void
  isVisible: boolean
  note: SNNote | undefined
  onSelect?: (component: SNComponent | undefined) => void
}

const getGroupId = (group: EditorMenuGroup) => group.title.toLowerCase().replace(/\s/, '-')

const ChangeEditorMenu: FunctionComponent<ChangeEditorMenuProps> = ({
  application,
  closeMenu,
  isVisible,
  note,
  onSelect,
}) => {
  const editors = useMemo(
    () =>
      application.componentManager.componentsForArea(ComponentArea.Editor).sort((a, b) => {
        return a.displayName.toLowerCase() < b.displayName.toLowerCase() ? -1 : 1
      }),
    [application.componentManager],
  )
  const groups = useMemo(() => createEditorMenuGroups(application, editors), [application, editors])
  const [currentEditor, setCurrentEditor] = useState<SNComponent>()

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

  const selectComponent = useCallback(
    async (component: SNComponent | null, note: SNNote) => {
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

      await application.getViewControllerManager().itemListController.insertCurrentIfTemplate()

      if (note.locked) {
        application.alertService.alert(STRING_EDIT_LOCKED_ATTEMPT).catch(console.error)
        return
      }

      if (!component) {
        transactions.push({
          itemUuid: note.uuid,
          mutate: (m: ItemMutator) => {
            const noteMutator = m as NoteMutator
            noteMutator.noteType = NoteType.Plain
            noteMutator.editorIdentifier = undefined
          },
        })
        reloadFont(application.getPreference(PrefKey.EditorMonospaceEnabled))
      } else {
        transactions.push({
          itemUuid: note.uuid,
          mutate: (m: ItemMutator) => {
            const noteMutator = m as NoteMutator
            noteMutator.noteType = component.noteType
            noteMutator.editorIdentifier = component.identifier
          },
        })
      }

      await application.mutator.runTransactionalMutations(transactions)
      application.sync.sync().catch(console.error)
      setCurrentEditor(application.componentManager.editorForNote(note))
    },
    [application],
  )

  const selectEditor = useCallback(
    async (itemToBeSelected: EditorMenuItem) => {
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

      if (shouldSelectEditor && note) {
        selectComponent(itemToBeSelected.component ?? null, note).catch(console.error)
      }

      closeMenu()

      if (onSelect) {
        onSelect(itemToBeSelected.component)
      }
    },
    [application.componentManager, closeMenu, currentEditor, note, onSelect, premiumModal, selectComponent],
  )

  return (
    <Menu className="pt-0.5 pb-1" a11yLabel="Change note type menu" isOpen={isVisible}>
      {groups
        .filter((group) => group.items && group.items.length)
        .map((group, index) => {
          const groupId = getGroupId(group)

          return (
            <Fragment key={groupId}>
              <div className={`border-0 border-t border-solid border-border py-1 ${index === 0 ? 'border-t-0' : ''}`}>
                {group.items.map((item) => {
                  const onClickEditorItem = () => {
                    selectEditor(item).catch(console.error)
                  }
                  return (
                    <MenuItem
                      key={item.name}
                      type={MenuItemType.RadioButton}
                      onClick={onClickEditorItem}
                      className={'flex-row-reverse py-2'}
                      checked={item.isEntitled ? isSelectedEditor(item) : undefined}
                    >
                      <div className="flex flex-grow items-center justify-between">
                        <div className="flex items-center">
                          {group.icon && <Icon type={group.icon} className={`mr-2 ${group.iconClassName}`} />}
                          {item.name}
                        </div>
                        {!item.isEntitled && <Icon type={PremiumFeatureIconName} className={PremiumFeatureIconClass} />}
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

export default ChangeEditorMenu
