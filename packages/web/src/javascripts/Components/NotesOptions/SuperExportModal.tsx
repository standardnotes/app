import { PrefKey, PrefValue, SNNote } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'
import Modal from '../Modal/Modal'
import usePreference from '@/Hooks/usePreference'
import RadioButtonGroup from '../RadioButtonGroup/RadioButtonGroup'
import { useEffect } from 'react'
import Switch from '../Switch/Switch'
import { noteHasEmbeddedFiles } from '@/Utils/NoteExportUtils'

type Props = {
  notes: SNNote[]
  exportNotes: () => void
  close: () => void
}

const SuperExportModal = ({ notes, exportNotes, close }: Props) => {
  const application = useApplication()
  const superNoteExportFormat = usePreference(PrefKey.SuperNoteExportFormat)
  const superNoteExportEmbedBehavior = usePreference(PrefKey.SuperNoteExportEmbedBehavior)
  const superNoteExportUseMDFrontmatter = usePreference(PrefKey.SuperNoteExportUseMDFrontmatter)

  useEffect(() => {
    if (superNoteExportFormat === 'json' && superNoteExportEmbedBehavior === 'separate') {
      void application.setPreference(PrefKey.SuperNoteExportEmbedBehavior, 'reference')
    }
    if (superNoteExportFormat === 'md' && superNoteExportEmbedBehavior === 'reference') {
      void application.setPreference(PrefKey.SuperNoteExportEmbedBehavior, 'separate')
    }
    if (superNoteExportFormat === 'pdf' && superNoteExportEmbedBehavior !== 'inline') {
      void application.setPreference(PrefKey.SuperNoteExportEmbedBehavior, 'inline')
    }
  }, [application, superNoteExportEmbedBehavior, superNoteExportFormat])

  const someNotesHaveEmbeddedFiles = notes.some(noteHasEmbeddedFiles)

  const canShowEmbeddedFileOptions = !['json', 'pdf'].includes(superNoteExportFormat)

  return (
    <Modal
      title="Export notes"
      className="p-4"
      close={close}
      actions={[
        {
          label: 'Cancel',
          type: 'cancel',
          onClick: close,
          mobileSlot: 'left',
        },
        {
          label: 'Export',
          type: 'primary',
          onClick: () => {
            close()
            exportNotes()
          },
          mobileSlot: 'right',
        },
      ]}
    >
      <div className="mb-2">
        <div className="mb-3 text-base">We detected your selection includes Super notes.</div>
        <div className="mb-1">What format do you want to export them in?</div>
        <RadioButtonGroup
          items={[
            { label: 'Super (.json)', value: 'json' },
            { label: 'Markdown (.md)', value: 'md' },
            { label: 'HTML', value: 'html' },
            { label: 'PDF', value: 'pdf' },
          ]}
          value={superNoteExportFormat}
          onChange={(value) => {
            void application.setPreference(
              PrefKey.SuperNoteExportFormat,
              value as PrefValue[PrefKey.SuperNoteExportFormat],
            )
          }}
        />
        {superNoteExportFormat === 'md' && (
          <div className="mt-2 text-xs text-passive-0">
            Note that conversion to Markdown is not lossless. Some features like collapsible blocks and formatting like
            superscript/subscript may not be correctly converted.
          </div>
        )}
      </div>
      {superNoteExportFormat === 'md' && (
        <div className="mt-4">
          <Switch
            checked={superNoteExportUseMDFrontmatter}
            onChange={(checked) => {
              void application.setPreference(
                PrefKey.SuperNoteExportUseMDFrontmatter,
                checked as PrefValue[PrefKey.SuperNoteExportUseMDFrontmatter],
              )
            }}
            className="!flex items-center"
          >
            <span className="ml-2">Export with frontmatter</span>
          </Switch>
        </div>
      )}
      {canShowEmbeddedFileOptions && someNotesHaveEmbeddedFiles && (
        <div className="mb-2 mt-4">
          <div className="mb-1">How do you want embedded files to be handled?</div>
          <RadioButtonGroup
            items={[
              { label: 'Inline', value: 'inline' },
              { label: 'Export separately', value: 'separate' },
            ].concat(superNoteExportFormat !== 'md' ? [{ label: 'Keep as reference', value: 'reference' }] : [])}
            value={superNoteExportEmbedBehavior}
            onChange={(value) => {
              void application.setPreference(
                PrefKey.SuperNoteExportEmbedBehavior,
                value as PrefValue[PrefKey.SuperNoteExportEmbedBehavior],
              )
            }}
          />
        </div>
      )}
    </Modal>
  )
}

export default SuperExportModal
