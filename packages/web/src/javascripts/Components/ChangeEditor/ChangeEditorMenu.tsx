import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { STRING_EDIT_LOCKED_ATTEMPT } from '@/Constants/Strings'
import { WebApplication } from '@/Application/WebApplication'
import {
  UIFeature,
  EditorFeatureDescription,
  NativeFeatureIdentifier,
  IframeComponentFeatureDescription,
  NoteMutator,
  NoteType,
  PrefKey,
  SNNote,
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
  onSelect?: (component: UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription>) => void
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
  const groups = useMemo(() => createEditorMenuGroups(application), [application])
  const [currentFeature, setCurrentFeature] =
    useState<UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription>>()
  const [pendingConversionItem, setPendingConversionItem] = useState<EditorMenuItem | null>(null)

  const showSuperNoteImporter =
    !!pendingConversionItem &&
    note?.noteType !== NoteType.Super &&
    pendingConversionItem.uiFeature.noteType === NoteType.Super
  const showSuperNoteConverter =
    !!pendingConversionItem &&
    note?.noteType === NoteType.Super &&
    pendingConversionItem.uiFeature.noteType !== NoteType.Super

  useEffect(() => {
    if (note) {
      setCurrentFeature(application.componentManager.editorForNote(note))
    }
  }, [application, note])

  const premiumModal = usePremiumModal()

  const isSelected = useCallback(
    (item: EditorMenuItem) => {
      if (currentFeature) {
        return item.uiFeature.featureIdentifier === currentFeature.featureIdentifier
      }

      const itemNoteTypeIsSameAsCurrentNoteType = item.uiFeature.noteType === note?.noteType
      const noteDoesntHaveTypeAndItemIsPlain = !note?.noteType && item.uiFeature.noteType === NoteType.Plain
      const unknownNoteTypeAndItemIsPlain =
        note?.noteType === NoteType.Unknown && item.uiFeature.noteType === NoteType.Plain

      return itemNoteTypeIsSameAsCurrentNoteType || noteDoesntHaveTypeAndItemIsPlain || unknownNoteTypeAndItemIsPlain
    },
    [currentFeature, note],
  )

  const selectComponent = useCallback(
    async (uiFeature: UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription>, note: SNNote) => {
      if (uiFeature.isComponent && uiFeature.asComponent.conflictOf) {
        void application.changeAndSaveItem.execute(uiFeature.asComponent, (mutator) => {
          mutator.conflictOf = undefined
        })
      }

      await application.itemListController.insertCurrentIfTemplate()

      await application.changeAndSaveItem.execute(note, (mutator) => {
        const noteMutator = mutator as NoteMutator
        noteMutator.noteType = uiFeature.noteType
        noteMutator.editorIdentifier = uiFeature.featureIdentifier
      })

      setCurrentFeature(application.componentManager.editorForNote(note))

      if (uiFeature.featureIdentifier === NativeFeatureIdentifier.TYPES.PlainEditor) {
        reloadFont(application.getPreference(PrefKey.EditorMonospaceEnabled))
      }
    },
    [application],
  )

  const handleMenuSelection = useCallback(
    async (menuItem: EditorMenuItem) => {
      if (!menuItem.isEntitled) {
        premiumModal.activate(menuItem.uiFeature.displayName)
        return
      }

      if (!note) {
        return
      }

      if (note.locked) {
        application.alerts.alert(STRING_EDIT_LOCKED_ATTEMPT).catch(console.error)
        return
      }

      if (menuItem.uiFeature.noteType === NoteType.Super) {
        if (note.noteType === NoteType.Super) {
          return
        }

        setPendingConversionItem(menuItem)
        setDisableClickOutside?.(true)
        return
      }

      if (note.noteType === NoteType.Super && note.text.length > 0) {
        setPendingConversionItem(menuItem)
        setDisableClickOutside?.(true)
        return
      }

      let shouldMakeSelection = true

      if (menuItem.uiFeature) {
        const changeRequiresAlert = application.componentManager.doesEditorChangeRequireAlert(
          currentFeature,
          menuItem.uiFeature,
        )

        if (changeRequiresAlert) {
          shouldMakeSelection = await application.componentManager.showEditorChangeAlert()
        }
      }

      if (shouldMakeSelection) {
        selectComponent(menuItem.uiFeature, note).catch(console.error)
      }

      closeMenu()

      if (onSelect) {
        onSelect(menuItem.uiFeature)
      }
    },
    [
      note,
      closeMenu,
      onSelect,
      premiumModal,
      application.alerts,
      application.componentManager,
      setDisableClickOutside,
      currentFeature,
      selectComponent,
    ],
  )

  const handleConversionCompletion = useCallback(() => {
    if (!pendingConversionItem || !note) {
      return
    }

    selectComponent(pendingConversionItem.uiFeature, note).catch(console.error)
    closeMenu()
  }, [pendingConversionItem, note, closeMenu, selectComponent])

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
      <Menu className="pb-1 pt-0.5" a11yLabel="Change note type menu" isOpen={isVisible}>
        {groups
          .filter((group) => group.items && group.items.length)
          .map((group, index) => {
            const groupId = getGroupId(group)

            return (
              <Fragment key={groupId}>
                <div
                  className={`border-0 border-t border-solid border-[--separator-color] py-1 ${
                    index === 0 ? 'border-t-0' : ''
                  }`}
                >
                  {group.items.map((menuItem) => {
                    const onClickEditorItem = () => {
                      handleMenuSelection(menuItem).catch(console.error)
                    }

                    return (
                      <MenuRadioButtonItem
                        key={menuItem.uiFeature.uniqueIdentifier.value}
                        onClick={onClickEditorItem}
                        className={'flex-row-reversed py-2'}
                        checked={isSelected(menuItem)}
                        info={menuItem.uiFeature.description}
                      >
                        <div className="flex flex-grow items-center justify-between">
                          <div className={`flex items-center ${group.featured ? 'font-bold' : ''}`}>
                            {group.icon && <Icon type={group.icon} className={`mr-2 ${group.iconClassName}`} />}
                            {menuItem.uiFeature.displayName}
                            {menuItem.isLabs && (
                              <Pill className="px-1.5 py-0.5" style="success">
                                Labs
                              </Pill>
                            )}
                          </div>
                          {!menuItem.isEntitled && (
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
