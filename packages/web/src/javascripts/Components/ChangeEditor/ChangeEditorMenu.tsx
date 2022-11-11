import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { STRING_EDIT_LOCKED_ATTEMPT } from '@/Constants/Strings'
import { WebApplication } from '@/Application/Application'
import { ComponentArea, NoteMutator, NoteType, PrefKey, SNComponent, SNNote } from '@standardnotes/snjs'
import { Fragment, FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import { EditorMenuGroup } from '@/Components/NotesOptions/EditorMenuGroup'
import { EditorMenuItem } from '@/Components/NotesOptions/EditorMenuItem'
import { createEditorMenuGroups } from '../../Utils/createEditorMenuGroups'
import { reloadFont } from '../NoteView/FontFunctions'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import { SuperNoteImporter } from '../BlockEditor/SuperNoteImporter'

type ChangeEditorMenuProps = {
  application: WebApplication
  closeMenu: () => void
  isVisible: boolean
  note: SNNote | undefined
  onSelect?: (component: SNComponent | undefined) => void
  handleDisableClickoutsideRequest?: () => void
}

const getGroupId = (group: EditorMenuGroup) => group.title.toLowerCase().replace(/\s/, '-')

const ChangeEditorMenu: FunctionComponent<ChangeEditorMenuProps> = ({
  application,
  closeMenu,
  isVisible,
  note,
  onSelect,
  handleDisableClickoutsideRequest,
}) => {
  const editors = useMemo(
    () =>
      application.componentManager.componentsForArea(ComponentArea.Editor).sort((a, b) => {
        return a.displayName.toLowerCase() < b.displayName.toLowerCase() ? -1 : 1
      }),
    [application.componentManager],
  )
  const groups = useMemo(() => createEditorMenuGroups(application, editors), [application, editors])
  const [currentComponent, setCurrentComponent] = useState<SNComponent>()
  const [showSuperImporter, setShowSuperImporter] = useState(false)
  const [pendingSuperItem, setPendingSuperItem] = useState<EditorMenuItem | null>(null)

  useEffect(() => {
    if (note) {
      setCurrentComponent(application.componentManager.editorForNote(note))
    }
  }, [application, note])

  const premiumModal = usePremiumModal()

  const isSelected = useCallback(
    (item: EditorMenuItem) => {
      if (currentComponent) {
        return item.component?.identifier === currentComponent.identifier
      }

      return item.noteType === note?.noteType || (!note?.noteType && item.noteType === NoteType.Plain)
    },
    [currentComponent, note],
  )

  const selectComponent = useCallback(
    async (component: SNComponent, note: SNNote) => {
      if (component.conflictOf) {
        void application.mutator.changeAndSaveItem(component, (mutator) => {
          mutator.conflictOf = undefined
        })
      }

      await application.getViewControllerManager().itemListController.insertCurrentIfTemplate()

      await application.mutator.changeAndSaveItem(note, (mutator) => {
        const noteMutator = mutator as NoteMutator
        noteMutator.noteType = component.noteType
        noteMutator.editorIdentifier = component.identifier
      })

      setCurrentComponent(application.componentManager.editorForNote(note))
    },
    [application],
  )

  const selectNonComponent = useCallback(
    async (item: EditorMenuItem, note: SNNote) => {
      await application.getViewControllerManager().itemListController.insertCurrentIfTemplate()

      reloadFont(application.getPreference(PrefKey.EditorMonospaceEnabled))

      await application.mutator.changeAndSaveItem(note, (mutator) => {
        const noteMutator = mutator as NoteMutator
        noteMutator.noteType = item.noteType
        noteMutator.editorIdentifier = undefined
      })

      setCurrentComponent(undefined)
    },
    [application],
  )

  const selectItem = useCallback(
    async (itemToBeSelected: EditorMenuItem) => {
      if (!itemToBeSelected.isEntitled) {
        premiumModal.activate(itemToBeSelected.name)
        return
      }

      if (note?.locked) {
        application.alertService.alert(STRING_EDIT_LOCKED_ATTEMPT).catch(console.error)
        return
      }

      if (itemToBeSelected.noteType === NoteType.Blocks) {
        setPendingSuperItem(itemToBeSelected)
        handleDisableClickoutsideRequest?.()
        setShowSuperImporter(true)
        return
      }

      let shouldMakeSelection = true

      if (itemToBeSelected.component) {
        const changeRequiresAlert = application.componentManager.doesEditorChangeRequireAlert(
          currentComponent,
          itemToBeSelected.component,
        )

        if (changeRequiresAlert) {
          shouldMakeSelection = await application.componentManager.showEditorChangeAlert()
        }
      }

      if (shouldMakeSelection && note) {
        if (itemToBeSelected.component) {
          selectComponent(itemToBeSelected.component, note).catch(console.error)
        } else {
          selectNonComponent(itemToBeSelected, note).catch(console.error)
        }
      }

      closeMenu()

      if (onSelect) {
        onSelect(itemToBeSelected.component)
      }
    },
    [
      application,
      closeMenu,
      currentComponent,
      note,
      onSelect,
      premiumModal,
      selectComponent,
      selectNonComponent,
      handleDisableClickoutsideRequest,
    ],
  )

  const handleSuperNoteConversionCompletion = useCallback(() => {
    if (!pendingSuperItem || !note) {
      return
    }

    selectNonComponent(pendingSuperItem, note).catch(console.error)
    closeMenu()
  }, [note, pendingSuperItem, selectNonComponent, closeMenu])

  return (
    <>
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
                      selectItem(item).catch(console.error)
                    }
                    return (
                      <MenuItem
                        key={item.name}
                        type={MenuItemType.RadioButton}
                        onClick={onClickEditorItem}
                        className={'flex-row-reverse py-2'}
                        checked={item.isEntitled ? isSelected(item) : undefined}
                      >
                        <div className="flex flex-grow items-center justify-between">
                          <div className={`flex items-center ${group.featured ? 'font-bold' : ''}`}>
                            {group.icon && <Icon type={group.icon} className={`mr-2 ${group.iconClassName}`} />}
                            {item.name}
                          </div>
                          {!item.isEntitled && (
                            <Icon type={PremiumFeatureIconName} className={PremiumFeatureIconClass} />
                          )}
                        </div>
                      </MenuItem>
                    )
                  })}
                </div>
              </Fragment>
            )
          })}
      </Menu>
      {showSuperImporter && note && (
        <SuperNoteImporter
          note={note}
          application={application}
          onConvertComplete={handleSuperNoteConversionCompletion}
          closeDialog={() => setShowSuperImporter(false)}
        />
      )}
    </>
  )
}

export default ChangeEditorMenu
