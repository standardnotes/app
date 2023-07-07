import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { STRING_EDIT_LOCKED_ATTEMPT } from '@/Constants/Strings'
import { WebApplication } from '@/Application/WebApplication'
import {
  ComponentArea,
  ComponentOrNativeFeature,
  NoteMutator,
  NoteType,
  PrefKey,
  SNNote,
  getComponentOrNativeFeatureNoteType,
  isNonNativeComponent,
} from '@standardnotes/snjs'
import { Fragment, FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import { EditorMenuGroup } from '@/Components/NotesOptions/EditorMenuGroup'
import { EditorMenuItem } from '@/Components/NotesOptions/EditorMenuItem'
import { createEditorMenuGroups } from '../../Utils/createEditorMenuGroups'
import { reloadFont } from '../NoteView/FontFunctions'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import { SuperNoteImporter } from '../SuperEditor/SuperNoteImporter'
import MenuRadioButtonItem from '../Menu/MenuRadioButtonItem'
import { Pill } from '../Preferences/PreferencesComponents/Content'
import ModalOverlay from '../Modal/ModalOverlay'
import SuperNoteConverter from '../SuperEditor/SuperNoteConverter'

type ChangeEditorMenuProps = {
  application: WebApplication
  closeMenu: () => void
  isVisible: boolean
  note: SNNote | undefined
  onSelect?: (component: ComponentOrNativeFeature | undefined) => void
  setDisableClickOutside?: (value: boolean) => void
}

const getGroupId = (group: EditorMenuGroup) => group.title.toLowerCase().replace(/\s/, '-')

const ChangeEditorMenu: FunctionComponent<ChangeEditorMenuProps> = ({
  application,
  closeMenu,
  isVisible,
  note,
  onSelect,
  setDisableClickOutside,
}) => {
  const editors = useMemo(
    () =>
      application.componentManager.componentsForArea(ComponentArea.Editor).sort((a, b) => {
        return a.displayName.toLowerCase() < b.displayName.toLowerCase() ? -1 : 1
      }),
    [application.componentManager],
  )
  const groups = useMemo(() => createEditorMenuGroups(application, editors), [application, editors])
  const [currentComponent, setCurrentComponent] = useState<ComponentOrNativeFeature>()
  const [pendingConversionItem, setPendingConversionItem] = useState<EditorMenuItem | null>(null)

  const showSuperNoteImporter =
    !!pendingConversionItem && note?.noteType !== NoteType.Super && pendingConversionItem.noteType === NoteType.Super
  const showSuperNoteConverter =
    !!pendingConversionItem && note?.noteType === NoteType.Super && pendingConversionItem.noteType !== NoteType.Super

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

      const itemNoteTypeIsSameAsCurrentNoteType = item.noteType === note?.noteType
      const noteDoesntHaveTypeAndItemIsPlain = !note?.noteType && item.noteType === NoteType.Plain
      const unknownNoteTypeAndItemIsPlain = note?.noteType === NoteType.Unknown && item.noteType === NoteType.Plain

      return itemNoteTypeIsSameAsCurrentNoteType || noteDoesntHaveTypeAndItemIsPlain || unknownNoteTypeAndItemIsPlain
    },
    [currentComponent, note],
  )

  const selectComponent = useCallback(
    async (component: ComponentOrNativeFeature, note: SNNote) => {
      if (isNonNativeComponent(component) && component.conflictOf) {
        void application.changeAndSaveItem(component, (mutator) => {
          mutator.conflictOf = undefined
        })
      }

      await application.getViewControllerManager().itemListController.insertCurrentIfTemplate()

      await application.changeAndSaveItem(note, (mutator) => {
        const noteMutator = mutator as NoteMutator
        noteMutator.noteType = getComponentOrNativeFeatureNoteType(component)
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

      await application.changeAndSaveItem(note, (mutator) => {
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

      if (!note) {
        return
      }

      if (note.locked) {
        application.alertService.alert(STRING_EDIT_LOCKED_ATTEMPT).catch(console.error)
        return
      }

      if (itemToBeSelected.noteType === NoteType.Super) {
        if (note.noteType === NoteType.Super) {
          return
        }

        setPendingConversionItem(itemToBeSelected)
        setDisableClickOutside?.(true)
        return
      }

      if (note.noteType === NoteType.Super && note.text.length > 0) {
        setPendingConversionItem(itemToBeSelected)
        setDisableClickOutside?.(true)
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

      if (shouldMakeSelection) {
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
      note,
      closeMenu,
      onSelect,
      premiumModal,
      application.alertService,
      application.componentManager,
      setDisableClickOutside,
      currentComponent,
      selectComponent,
      selectNonComponent,
    ],
  )

  const handleConversionCompletion = useCallback(() => {
    if (!pendingConversionItem || !note) {
      return
    }

    if (pendingConversionItem.component) {
      selectComponent(pendingConversionItem.component, note).catch(console.error)
      closeMenu()
      return
    }

    selectNonComponent(pendingConversionItem, note).catch(console.error)
    closeMenu()
  }, [pendingConversionItem, note, selectNonComponent, closeMenu, selectComponent])

  const closeSuperNoteImporter = () => {
    setPendingConversionItem(null)
    setDisableClickOutside?.(false)
  }
  const closeSuperNoteConverter = () => {
    setPendingConversionItem(null)
    setDisableClickOutside?.(false)
  }

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
                      <MenuRadioButtonItem
                        key={item.name}
                        onClick={onClickEditorItem}
                        className={'flex-row-reversed py-2'}
                        checked={item.isEntitled ? isSelected(item) : false}
                        info={item.description}
                      >
                        <div className="flex flex-grow items-center justify-between">
                          <div className={`flex items-center ${group.featured ? 'font-bold' : ''}`}>
                            {group.icon && <Icon type={group.icon} className={`mr-2 ${group.iconClassName}`} />}
                            {item.name}
                            {item.isLabs && (
                              <Pill className="py-0.5 px-1.5" style="success">
                                Labs
                              </Pill>
                            )}
                          </div>
                          {!item.isEntitled && (
                            <Icon type={PremiumFeatureIconName} className={PremiumFeatureIconClass} />
                          )}
                        </div>
                      </MenuRadioButtonItem>
                    )
                  })}
                </div>
              </Fragment>
            )
          })}
      </Menu>
      <ModalOverlay isOpen={showSuperNoteImporter} close={closeSuperNoteImporter}>
        {note && (
          <SuperNoteImporter
            note={note}
            application={application}
            onComplete={handleConversionCompletion}
            closeDialog={closeSuperNoteImporter}
          />
        )}
      </ModalOverlay>
      <ModalOverlay isOpen={showSuperNoteConverter} close={closeSuperNoteConverter}>
        {note && pendingConversionItem && (
          <SuperNoteConverter
            note={note}
            convertTo={pendingConversionItem}
            closeDialog={closeSuperNoteConverter}
            onComplete={handleConversionCompletion}
          />
        )}
      </ModalOverlay>
    </>
  )
}

export default ChangeEditorMenu
