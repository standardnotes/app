import Icon from '@/Components/Icon/Icon'
import { FunctionComponent } from 'react'
import { UIFeature, EditorFeatureDescription, IframeComponentFeatureDescription, SNNote } from '@standardnotes/snjs'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { iconClass } from './ClassNames'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'

export const SpellcheckOptions: FunctionComponent<{
  editorForNote: UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription>
  notesController: NotesController
  note: SNNote
  disabled?: boolean
}> = ({ editorForNote, notesController, note, disabled }) => {
  const spellcheckControllable = editorForNote.featureDescription.spellcheckControl
  const noteSpellcheck = !spellcheckControllable
    ? true
    : note
    ? notesController.getSpellcheckStateForNote(note)
    : undefined

  return (
    <div className="flex flex-col">
      <MenuSwitchButtonItem
        checked={Boolean(noteSpellcheck)}
        onChange={() => {
          notesController.toggleGlobalSpellcheckForNote(note).catch(console.error)
        }}
        disabled={disabled || !spellcheckControllable}
      >
        <Icon type="notes" className={iconClass} />
        Spellcheck
      </MenuSwitchButtonItem>
      {!spellcheckControllable && (
        <p className="px-3 py-1.5 text-xs">Spellcheck cannot be controlled for this editor.</p>
      )}
    </div>
  )
}
