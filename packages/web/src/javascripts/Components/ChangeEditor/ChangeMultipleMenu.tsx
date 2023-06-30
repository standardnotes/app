import { WebApplication } from '@/Application/WebApplication'
import { STRING_EDIT_LOCKED_ATTEMPT } from '@/Constants/Strings'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { createEditorMenuGroups } from '@/Utils/createEditorMenuGroups'
import { ComponentArea, NoteMutator, NoteType, SNComponent, SNNote } from '@standardnotes/snjs'
import { Fragment, useCallback, useMemo, useState } from 'react'
import Icon from '../Icon/Icon'
import { PremiumFeatureIconName, PremiumFeatureIconClass } from '../Icon/PremiumFeatureIcon'
import Menu from '../Menu/Menu'
import MenuItem from '../Menu/MenuItem'
import { EditorMenuGroup } from '../NotesOptions/EditorMenuGroup'
import { EditorMenuItem } from '../NotesOptions/EditorMenuItem'
import { SuperNoteImporter } from '../SuperEditor/SuperNoteImporter'
import { Pill } from '../Preferences/PreferencesComponents/Content'
import ModalOverlay from '../Modal/ModalOverlay'

const getGroupId = (group: EditorMenuGroup) => group.title.toLowerCase().replace(/\s/, '-')

type Props = {
  application: WebApplication
  notes: SNNote[]
  setDisableClickOutside: (value: boolean) => void
}

const ChangeMultipleMenu = ({ application, notes, setDisableClickOutside }: Props) => {
  const premiumModal = usePremiumModal()

  const [itemToBeSelected, setItemToBeSelected] = useState<EditorMenuItem | undefined>()
  const [confirmationQueue, setConfirmationQueue] = useState<SNNote[]>([])

  const hasSelectedLockedNotes = useMemo(() => notes.some((note) => note.locked), [notes])

  const editors = useMemo(
    () =>
      application.componentManager.componentsForArea(ComponentArea.Editor).sort((a, b) => {
        return a.displayName.toLowerCase() < b.displayName.toLowerCase() ? -1 : 1
      }),
    [application.componentManager],
  )
  const groups = useMemo(() => createEditorMenuGroups(application, editors), [application, editors])

  const selectComponent = useCallback(
    async (component: SNComponent, note: SNNote) => {
      if (component.conflictOf) {
        void application.changeAndSaveItem(component, (mutator) => {
          mutator.conflictOf = undefined
        })
      }

      await application.changeAndSaveItem(note, (mutator) => {
        const noteMutator = mutator as NoteMutator
        noteMutator.noteType = component.noteType
        noteMutator.editorIdentifier = component.identifier
      })
    },
    [application],
  )

  const selectNonComponent = useCallback(
    async (item: EditorMenuItem, note: SNNote) => {
      await application.changeAndSaveItem(note, (mutator) => {
        const noteMutator = mutator as NoteMutator
        noteMutator.noteType = item.noteType
        noteMutator.editorIdentifier = undefined
      })
    },
    [application],
  )

  const selectItem = useCallback(
    async (itemToBeSelected: EditorMenuItem) => {
      if (!itemToBeSelected.isEntitled) {
        premiumModal.activate(itemToBeSelected.name)
        return
      }

      if (hasSelectedLockedNotes) {
        void application.alertService.alert(STRING_EDIT_LOCKED_ATTEMPT)
        return
      }

      if (itemToBeSelected.noteType === NoteType.Super) {
        setDisableClickOutside(true)
        setItemToBeSelected(itemToBeSelected)
        setConfirmationQueue(notes)
        return
      }

      if (itemToBeSelected.component) {
        const changeRequiresConfirmation = notes.some((note) => {
          const editorForNote = application.componentManager.editorForNote(note)
          return application.componentManager.doesEditorChangeRequireAlert(editorForNote, itemToBeSelected.component)
        })

        if (changeRequiresConfirmation) {
          const canChange = await application.componentManager.showEditorChangeAlert()
          if (!canChange) {
            return
          }
        }

        for (const note of notes) {
          void selectComponent(itemToBeSelected.component, note)
        }

        return
      }

      for (const note of notes) {
        void selectNonComponent(itemToBeSelected, note)
      }
    },
    [
      application.alertService,
      application.componentManager,
      hasSelectedLockedNotes,
      notes,
      premiumModal,
      selectComponent,
      selectNonComponent,
      setDisableClickOutside,
    ],
  )

  const groupsWithItems = groups.filter((group) => group.items && group.items.length)

  const showSuperImporter = itemToBeSelected?.noteType === NoteType.Super && confirmationQueue.length > 0

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

    void selectNonComponent(itemToBeSelected, confirmationQueue[0])

    closeCurrentSuperNoteImporter()
  }, [closeCurrentSuperNoteImporter, confirmationQueue, itemToBeSelected, selectNonComponent])

  return (
    <>
      <Menu isOpen={true} a11yLabel="Change note type">
        {groupsWithItems.map((group, index) => (
          <Fragment key={getGroupId(group)}>
            <div className={`border-0 border-t border-solid border-border py-1 ${index === 0 ? 'border-t-0' : ''}`}>
              {group.items.map((item) => {
                const onClickEditorItem = () => {
                  selectItem(item).catch(console.error)
                }
                return (
                  <MenuItem key={item.name} onClick={onClickEditorItem} className={'flex-row-reversed py-2'}>
                    <div className="flex flex-grow items-center justify-between">
                      <div className={'flex items-center'}>
                        {group.icon && <Icon type={group.icon} className={`mr-2 ${group.iconClassName}`} />}
                        {item.name}
                        {item.isLabs && (
                          <Pill className="py-0.5 px-1.5" style="success">
                            Labs
                          </Pill>
                        )}
                      </div>
                      {!item.isEntitled && <Icon type={PremiumFeatureIconName} className={PremiumFeatureIconClass} />}
                    </div>
                  </MenuItem>
                )
              })}
            </div>
          </Fragment>
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

export default ChangeMultipleMenu
