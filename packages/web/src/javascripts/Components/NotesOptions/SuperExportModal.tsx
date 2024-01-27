import { PrefKey, PrefValue, SNNote } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'
import Modal from '../Modal/Modal'
import usePreference from '@/Hooks/usePreference'
import { useEffect } from 'react'
import Switch from '../Switch/Switch'
import { noteHasEmbeddedFiles } from '@/Utils/NoteExportUtils'
import Dropdown from '../Dropdown/Dropdown'

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
  const superNoteExportPDFPageSize = usePreference(PrefKey.SuperNoteExportPDFPageSize)

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
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-base">Choose export format {notes.length > 1 ? 'for Super notes' : ''}</div>
          <Dropdown
            label="Export format"
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
            classNameOverride={{
              wrapper: 'w-full md:w-fit',
            }}
          />
        </div>
        {superNoteExportFormat === 'md' && (
          <div className="mt-2 text-xs text-passive-0">
            Note that conversion to Markdown is not lossless. Some features like collapsible blocks and formatting like
            superscript/subscript may not be correctly converted.
          </div>
        )}
      </div>
      {superNoteExportFormat === 'pdf' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-base">Page size</div>
          <Dropdown
            label="Page size"
            items={
              [
                { label: 'A3', value: 'A3' },
                { label: 'A4', value: 'A4' },
                { label: 'Letter', value: 'LETTER' },
                { label: 'Legal', value: 'LEGAL' },
                { label: 'Tabloid', value: 'TABLOID' },
              ] satisfies {
                label: string
                value: PrefValue[PrefKey.SuperNoteExportPDFPageSize]
              }[]
            }
            value={superNoteExportPDFPageSize}
            onChange={(value) => {
              void application.setPreference(
                PrefKey.SuperNoteExportPDFPageSize,
                value as PrefValue[PrefKey.SuperNoteExportPDFPageSize],
              )
            }}
            classNameOverride={{
              wrapper: 'w-full md:w-fit',
            }}
          />
        </div>
      )}
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
        <div className="mb-2 mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-base">Embedded files</div>
          <Dropdown
            label="Embedded files"
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
