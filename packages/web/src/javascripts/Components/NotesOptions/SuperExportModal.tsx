import { PrefKey, PrefValue } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'
import Dropdown from '../Dropdown/Dropdown'
import Modal from '../Modal/Modal'
import usePreference from '@/Hooks/usePreference'

type Props = {
  exportNotes: () => void
  close: () => void
}

const SuperExportModal = ({ exportNotes, close }: Props) => {
  const application = useApplication()
  const superNoteExportFormat = usePreference(PrefKey.SuperNoteExportFormat)

  return (
    <Modal
      title="Export notes"
      className={{
        description: 'p-4',
      }}
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
          onClick: exportNotes,
          mobileSlot: 'right',
        },
      ]}
    >
      <div className="mb-4">
        <div className="mb-1 text-base">
          We detected your selection includes Super notes. How do you want to export them?
        </div>
        <Dropdown
          label="Super notes export format"
          items={[
            { label: 'Keep as Super', value: 'json' },
            { label: 'Markdown', value: 'md' },
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
      </div>
      <div className="text-passive-0">
        Note that if you convert Super notes to Markdown then import them back into Standard Notes in the future, you
        will lose some formatting that the Markdown format is incapable of expressing, such as collapsible blocks and
        embeds.
      </div>
    </Modal>
  )
}

export default SuperExportModal
