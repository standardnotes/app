import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'
import { FunctionComponent } from 'react'
import { SNComponent, SNNote } from '@standardnotes/snjs'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { iconClass } from './NotesOptions'

export const SpellcheckOptions: FunctionComponent<{
  editorForNote: SNComponent | undefined
  notesController: NotesController
  note: SNNote
  className: string
}> = ({ editorForNote, notesController, note, className }) => {
  const spellcheckControllable = Boolean(!editorForNote || editorForNote.package_info.spellcheckControl)
  const noteSpellcheck = !spellcheckControllable
    ? true
    : note
    ? notesController.getSpellcheckStateForNote(note)
    : undefined

  return (
    <div className="flex flex-col">
      <button
        className={className}
        onClick={() => {
          notesController.toggleGlobalSpellcheckForNote(note).catch(console.error)
        }}
        disabled={!spellcheckControllable}
      >
        <span className="flex items-center">
          <Icon type="notes" className={iconClass} />
          Spellcheck
        </span>
        <Switch className="px-0" checked={noteSpellcheck} disabled={!spellcheckControllable} />
      </button>
      {!spellcheckControllable && (
        <p className="px-3 py-1.5 text-xs">Spellcheck cannot be controlled for this editor.</p>
      )}
    </div>
  )
}
