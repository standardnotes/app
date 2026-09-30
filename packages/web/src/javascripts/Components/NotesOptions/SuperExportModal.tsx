import { PrefKey, PrefValue } from '@standardnotes/snjs'
import { SuperName, jtString } from '@standardnotes/features'
import { c } from 'ttag'
import { useApplication } from '../ApplicationProvider'
import Modal from '../Modal/Modal'
import usePreference from '@/Hooks/usePreference'
import { useEffect } from 'react'
import Switch from '../Switch/Switch'
import { noteHasEmbeddedFiles } from '@/Utils/NoteExportUtils'
import Dropdown from '../Dropdown/Dropdown'
import ModalOverlay from '../Modal/ModalOverlay'
import { observer } from 'mobx-react-lite'

const ModalContent = observer(() => {
  const application = useApplication()
  const notesController = application.notesController
  const notes = notesController.selectedNotes

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
      title={c('B4.Notes.EditorOptions.Label').t`Export notes`}
      className="p-4"
      close={notesController.closeSuperExportModal}
      actions={[
        {
          label: c('B4.Notes.EditorOptions.Action').t`Cancel`,
          type: 'cancel',
          onClick: notesController.closeSuperExportModal,
          mobileSlot: 'left',
        },
        {
          label: c('B4.Notes.EditorOptions.Action').t`Export`,
          type: 'primary',
          onClick: () => {
            void notesController.downloadSelectedNotes()
            notesController.closeSuperExportModal()
          },
          mobileSlot: 'right',
        },
      ]}
    >
      <div className="mb-2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-base">
            {notes.length > 1
              ? jtString(c('B4.Notes.EditorOptions.Label').jt`Choose export format for ${SuperName} notes`)
              : c('B4.Notes.EditorOptions.Label').t`Choose export format`}
          </div>
          <Dropdown
            label={c('B4.Notes.EditorOptions.Label').t`Export format`}
            items={[
              { label: jtString(c('B4.Notes.EditorOptions.Label').jt`${SuperName} (.json)`), value: 'json' },
              { label: c('B4.Notes.EditorOptions.Label').t`Markdown (.md)`, value: 'md' },
              { label: c('B4.Notes.EditorOptions.Label').t`HTML`, value: 'html' },
              { label: c('B4.Notes.EditorOptions.Label').t`PDF`, value: 'pdf' },
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
            {c('B4.Notes.EditorOptions.Info')
              .t`Note that conversion to Markdown is not lossless. Some features like collapsible blocks and formatting like superscript/subscript may not be correctly converted.`}
          </div>
        )}
      </div>
      {superNoteExportFormat === 'pdf' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-base">{c('B4.Notes.EditorOptions.Label').t`Page size`}</div>
          <Dropdown
            label={c('B4.Notes.EditorOptions.Label').t`Page size`}
            items={
              [
                { label: c('B4.Notes.EditorOptions.Label').t`A3`, value: 'A3' },
                { label: c('B4.Notes.EditorOptions.Label').t`A4`, value: 'A4' },
                { label: c('B4.Notes.EditorOptions.Label').t`Letter`, value: 'LETTER' },
                { label: c('B4.Notes.EditorOptions.Label').t`Legal`, value: 'LEGAL' },
                { label: c('B4.Notes.EditorOptions.Label').t`Tabloid`, value: 'TABLOID' },
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
            <span className="ml-2">{c('B4.Notes.EditorOptions.Label').t`Export with frontmatter`}</span>
          </Switch>
        </div>
      )}
      {canShowEmbeddedFileOptions && someNotesHaveEmbeddedFiles && (
        <div className="mb-2 mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-base">{c('B4.Notes.EditorOptions.Action').t`Embedded files`}</div>
          <Dropdown
            label={c('B4.Notes.EditorOptions.Label').t`Embedded files`}
            items={[
              { label: c('B4.Notes.EditorOptions.Label').t`Inline`, value: 'inline' },
              { label: c('B4.Notes.EditorOptions.Action').t`Export separately`, value: 'separate' },
            ].concat(
              superNoteExportFormat !== 'md'
                ? [{ label: c('B4.Notes.EditorOptions.Label').t`Keep as reference`, value: 'reference' }]
                : [],
            )}
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
})

const SuperExportModal = () => {
  const application = useApplication()
  const notesController = application.notesController

  return (
    <ModalOverlay
      isOpen={notesController.shouldShowSuperExportModal}
      close={notesController.closeSuperExportModal}
      className="md:max-w-[25vw]"
    >
      <ModalContent />
    </ModalOverlay>
  )
}

export default observer(SuperExportModal)
