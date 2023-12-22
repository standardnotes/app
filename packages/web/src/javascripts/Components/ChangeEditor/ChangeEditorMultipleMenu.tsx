import { WebApplication } from '@/Application/WebApplication'
import { STRING_EDIT_LOCKED_ATTEMPT } from '@/Constants/Strings'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { createEditorMenuGroups } from '@/Utils/createEditorMenuGroups'
import {
  UIFeature,
  EditorFeatureDescription,
  IframeComponentFeatureDescription,
  NoteMutator,
  NoteType,
  SNNote,
  NativeFeatureIdentifier,
} from '@standardnotes/snjs'
import { useCallback, useMemo, useState } from 'react'
import Icon from '../Icon/Icon'
import { PremiumFeatureIconName, PremiumFeatureIconClass } from '../Icon/PremiumFeatureIcon'
import Menu from '../Menu/Menu'
import MenuItem from '../Menu/MenuItem'
import { EditorMenuGroup } from '../NotesOptions/EditorMenuGroup'
import { EditorMenuItem } from '../NotesOptions/EditorMenuItem'
import { SuperNoteImporter } from '../SuperEditor/SuperNoteImporter'
import { Pill } from '../Preferences/PreferencesComponents/Content'
import ModalOverlay from '../Modal/ModalOverlay'
import MenuSection from '../Menu/MenuSection'

const getGroupId = (group: EditorMenuGroup) => group.title.toLowerCase().replace(/\s/, '-')

type Props = {
  application: WebApplication
  notes: SNNote[]
  setDisableClickOutside: (value: boolean) => void
}

const ChangeEditorMultipleMenu = ({ application, notes, setDisableClickOutside }: Props) => {
  const premiumModal = usePremiumModal()

  const [itemToBeSelected, setItemToBeSelected] = useState<EditorMenuItem | undefined>()
  const [confirmationQueue, setConfirmationQueue] = useState<SNNote[]>([])

  const hasSelectedLockedNotes = useMemo(() => notes.some((note) => note.locked), [notes])

  const groups = useMemo(() => createEditorMenuGroups(application), [application])

  const selectComponent = useCallback(
    async (uiFeature: UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription>, note: SNNote) => {
      if (uiFeature.isComponent && uiFeature.asComponent.conflictOf) {
        void application.changeAndSaveItem.execute(uiFeature.asComponent, (mutator) => {
          mutator.conflictOf = undefined
        })
      }

      await application.changeAndSaveItem.execute(note, (mutator) => {
        const noteMutator = mutator as NoteMutator
        noteMutator.noteType = uiFeature.noteType
        noteMutator.editorIdentifier = uiFeature.featureIdentifier
      })
    },
    [application],
  )

  const handleMenuSelection = useCallback(
    async (itemToBeSelected: EditorMenuItem) => {
      if (!itemToBeSelected.isEntitled) {
        if (itemToBeSelected.uiFeature.featureIdentifier === NativeFeatureIdentifier.TYPES.SuperEditor) {
          premiumModal.showSuperDemo()
          return
        }

        premiumModal.activate(itemToBeSelected.uiFeature.displayName)
        return
      }

      if (hasSelectedLockedNotes) {
        void application.alerts.alert(STRING_EDIT_LOCKED_ATTEMPT)
        return
      }

      if (itemToBeSelected.uiFeature.noteType === NoteType.Super) {
        setDisableClickOutside(true)
        setItemToBeSelected(itemToBeSelected)
        setConfirmationQueue(notes)
        return
      }

      const changeRequiresConfirmation = notes.some((note) => {
        const editorForNote = application.componentManager.editorForNote(note)
        return application.componentManager.doesEditorChangeRequireAlert(editorForNote, itemToBeSelected.uiFeature)
      })

      if (changeRequiresConfirmation) {
        const canChange = await application.componentManager.showEditorChangeAlert()
        if (!canChange) {
          return
        }
      }

      for (const note of notes) {
        void selectComponent(itemToBeSelected.uiFeature, note)
      }
    },
    [
      application.alerts,
      application.componentManager,
      hasSelectedLockedNotes,
      notes,
      premiumModal,
      selectComponent,
      setDisableClickOutside,
    ],
  )

  const groupsWithItems = groups.filter((group) => group.items && group.items.length)

  const showSuperImporter = itemToBeSelected?.uiFeature.noteType === NoteType.Super && confirmationQueue.length > 0

  const closeCurrentSuperNoteImporter = useCallback(() => {
    const remainingNotes = confirmationQueue.slice(1)

    if (remainingNotes.length === 0) {
      setItemToBeSelected(undefined)
      setConfirmationQueue([])
      setDisableClickOutside(false)
      return
    }

    setConfirmationQueue(remainingNotes)
  }, [confirmationQueue, setDisableClickOutside])

  const handleSuperNoteConversionCompletion = useCallback(() => {
    if (!itemToBeSelected) {
      return
    }

    void selectComponent(itemToBeSelected.uiFeature, confirmationQueue[0])

    closeCurrentSuperNoteImporter()
  }, [closeCurrentSuperNoteImporter, confirmationQueue, itemToBeSelected, selectComponent])

  return (
    <>
      <Menu a11yLabel="Change note type">
        {groupsWithItems.map((group) => (
          <MenuSection key={getGroupId(group)}>
            {group.items.map((item) => {
              const onClickEditorItem = () => {
                handleMenuSelection(item).catch(console.error)
              }
              return (
                <MenuItem
                  key={item.uiFeature.uniqueIdentifier.value}
                  onClick={onClickEditorItem}
                  className={'flex-row-reversed py-2'}
                >
                  <div className="flex flex-grow items-center justify-between">
                    <div className={'flex items-center'}>
                      {group.icon && <Icon type={group.icon} className={`mr-2 ${group.iconClassName}`} />}
                      {item.uiFeature.displayName}
                      {item.isLabs && (
                        <Pill className="px-1.5 py-0.5" style="success">
                          Labs
                        </Pill>
                      )}
                    </div>
                    {!item.isEntitled && <Icon type={PremiumFeatureIconName} className={PremiumFeatureIconClass} />}
                  </div>
                </MenuItem>
              )
            })}
          </MenuSection>
        ))}
      </Menu>
      <ModalOverlay isOpen={showSuperImporter} close={closeCurrentSuperNoteImporter}>
        {confirmationQueue[0] && (
          <SuperNoteImporter
            note={confirmationQueue[0]}
            application={application}
            onComplete={handleSuperNoteConversionCompletion}
            closeDialog={closeCurrentSuperNoteImporter}
          />
        )}
      </ModalOverlay>
    </>
  )
}

export default ChangeEditorMultipleMenu
