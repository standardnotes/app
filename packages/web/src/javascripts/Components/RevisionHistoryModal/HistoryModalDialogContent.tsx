import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import HistoryListContainer from './HistoryListContainer'
import { RevisionHistoryModalContentProps } from './RevisionHistoryModalProps'
import HistoryModalFooter from './HistoryModalFooter'
import HistoryModalContentPane from './HistoryModalContentPane'
import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'
import Icon from '../Icon/Icon'
import { classNames } from '@/Utils/ConcatenateClassNames'

const HistoryModalDialogContent = ({
  application,
  dismissModal,
  notesController,
  subscriptionController,
  note,
  selectionController,
}: RevisionHistoryModalContentProps) => {
  const [noteHistoryController] = useState(() => new NoteHistoryController(application, note, selectionController))

  const [selectedMobileTab, setSelectedMobileTab] = useState<'List' | 'Content'>('Content')

  return (
    <>
      <div className="flex items-center border-b border-border md:hidden">
        <button
          className={classNames(
            'relative cursor-pointer border-0 bg-default px-3 py-2.5 text-sm focus:shadow-inner',
            selectedMobileTab === 'List' ? 'font-medium text-info shadow-bottom' : 'text-text',
          )}
          onClick={() => {
            setSelectedMobileTab('List')
          }}
        >
          List
        </button>
        <button
          className={classNames(
            'relative cursor-pointer border-0 bg-default px-3 py-2.5 text-sm focus:shadow-inner',
            selectedMobileTab === 'Content' ? 'font-medium text-info shadow-bottom' : 'text-text',
          )}
          onClick={() => {
            setSelectedMobileTab('Content')
          }}
        >
          Content
        </button>
        <button className="ml-auto mr-2 rounded-full border border-border p-1.5" onClick={dismissModal}>
          <Icon type="close" className="h-4 w-4" />
        </button>
      </div>
      <div className="flex min-h-0 flex-grow">
        <div
          className={classNames(
            'w-full md:flex md:w-auto md:min-w-60',
            selectedMobileTab === 'List' ? 'flex' : 'hidden',
          )}
        >
          <HistoryListContainer features={application.features} noteHistoryController={noteHistoryController} />
        </div>
        <div
          className={classNames(
            'relative flex-grow flex-col md:flex',
            selectedMobileTab === 'Content' ? 'flex' : 'hidden',
          )}
        >
          <HistoryModalContentPane
            application={application}
            noteHistoryController={noteHistoryController}
            notesController={notesController}
            subscriptionController={subscriptionController}
          />
        </div>
      </div>
      <HistoryModalFooter dismissModal={dismissModal} noteHistoryController={noteHistoryController} />
    </>
  )
}

export default observer(HistoryModalDialogContent)
