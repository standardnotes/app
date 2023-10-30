import { PrefKey, PrefValue } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'
import Modal from '../Modal/Modal'
import usePreference from '@/Hooks/usePreference'
import RadioButtonGroup from '../RadioButtonGroup/RadioButtonGroup'
import { useEffect } from 'react'

type Props = {
  exportNotes: () => void
  close: () => void
}

const SuperExportModal = ({ exportNotes, close }: Props) => {
  const application = useApplication()
  const superNoteExportFormat = usePreference(PrefKey.SuperNoteExportFormat)
  const superNoteExportEmbedBehavior = usePreference(PrefKey.SuperNoteExportEmbedBehavior)

  useEffect(() => {
    if (superNoteExportFormat === 'json' && superNoteExportEmbedBehavior === 'separate') {
      void application.setPreference(PrefKey.SuperNoteExportEmbedBehavior, 'reference')
    }
    if (superNoteExportFormat !== 'json' && superNoteExportEmbedBehavior === 'reference') {
      void application.setPreference(PrefKey.SuperNoteExportEmbedBehavior, 'separate')
    }
  }, [application, superNoteExportEmbedBehavior, superNoteExportFormat])

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
      <div className="mb-4">
        <div className="mb-3 text-base">We detected your selection includes Super notes.</div>
        <div className="mb-1">What format do you want to export them in?</div>
        <RadioButtonGroup
          items={[
            { label: 'Super (.json)', value: 'json' },
            { label: 'Markdown (.md)', value: 'md' },
            { label: 'HTML', value: 'html' },
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
      <div className="mb-2">
        <div className="mb-1">How do you want embedded files to be handled?</div>
        <RadioButtonGroup
          items={[{ label: 'Inline', value: 'inline' }].concat(
            superNoteExportFormat === 'json'
              ? [{ label: 'Keep as reference', value: 'reference' }]
              : [{ label: 'Export separately', value: 'separate' }],
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
    </Modal>
  )
}

export default SuperExportModal
