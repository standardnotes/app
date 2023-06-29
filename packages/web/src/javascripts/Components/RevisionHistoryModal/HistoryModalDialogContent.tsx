import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'
import HistoryListContainer from './HistoryListContainer'
import { RevisionHistoryModalContentProps } from './RevisionHistoryModalProps'
import HistoryModalFooter from './HistoryModalFooter'
import HistoryModalContentPane from './HistoryModalContentPane'
import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'
import Icon from '../Icon/Icon'
import { classNames } from '@standardnotes/utils'
import { HistoryModalMobileTab } from './utils'
import MobileModalAction from '../Modal/MobileModalAction'
import Popover from '../Popover/Popover'
import MobileModalHeader from '../Modal/MobileModalHeader'

const HistoryModalDialogContent = ({
  application,
  dismissModal,
  subscriptionController,
  note,
  selectionController,
}: RevisionHistoryModalContentProps) => {
  const [noteHistoryController] = useState(() => new NoteHistoryController(application, note, selectionController))

  const [selectedMobileTab, setSelectedMobileTab] = useState<HistoryModalMobileTab>('List')
  const tabOptionRef = useRef<HTMLButtonElement>(null)
  const [showTabMenu, setShowTabMenu] = useState(false)
  const toggleTabMenu = () => setShowTabMenu((show) => !show)

  return (
    <>
      <MobileModalHeader className="items-center border-b border-border py-1 px-2 md:hidden">
        <MobileModalAction type="secondary" action={toggleTabMenu} slot="left" ref={tabOptionRef}>
          <div className="rounded-full border border-border p-0.5">
            <Icon type="more" />
          </div>
        </MobileModalAction>
        <Popover
          title="Advanced"
          open={showTabMenu}
          anchorElement={tabOptionRef.current}
          disableMobileFullscreenTakeover={true}
          togglePopover={toggleTabMenu}
          align="start"
          portal={false}
          className="w-1/2 !min-w-0 divide-y divide-border border border-border"
        >
          <button
            onClick={() => {
              setSelectedMobileTab('List')
              toggleTabMenu()
            }}
            className="p-1.5 text-base font-semibold hover:bg-contrast focus:bg-info-backdrop focus:shadow-none focus:outline-none"
          >
            List
          </button>
          <button
            onClick={() => {
              setSelectedMobileTab('Content')
              toggleTabMenu()
            }}
            className="p-1.5 text-base font-semibold hover:bg-contrast focus:bg-info-backdrop focus:shadow-none focus:outline-none"
          >
            Content
          </button>
        </Popover>
        <div className="text-center text-base font-semibold">History</div>
        <MobileModalAction type="primary" slot="right" action={dismissModal}>
          Done
        </MobileModalAction>
      </MobileModalHeader>
      <div className="flex min-h-0 flex-grow">
        <div
          className={classNames(
            'w-full md:flex md:w-auto md:min-w-60',
            selectedMobileTab === 'List' ? 'flex' : 'hidden',
          )}
        >
          <HistoryListContainer
            features={application.features}
            noteHistoryController={noteHistoryController}
            selectMobileModalTab={setSelectedMobileTab}
          />
        </div>
        <div
          className={classNames(
            'relative flex-grow flex-col md:flex',
            selectedMobileTab === 'Content' ? 'flex' : 'hidden',
          )}
        >
          <HistoryModalContentPane
            noteHistoryController={noteHistoryController}
            note={note}
            subscriptionController={subscriptionController}
          />
        </div>
      </div>
      <HistoryModalFooter dismissModal={dismissModal} noteHistoryController={noteHistoryController} />
    </>
  )
}

export default observer(HistoryModalDialogContent)
