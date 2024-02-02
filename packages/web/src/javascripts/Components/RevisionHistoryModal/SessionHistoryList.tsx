import { Fragment, FunctionComponent, useMemo, useState } from 'react'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import HistoryListItem from './HistoryListItem'
import { observer } from 'mobx-react-lite'
import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'

type Props = {
  noteHistoryController: NoteHistoryController
  onSelectRevision: () => void
}

const SessionHistoryList: FunctionComponent<Props> = ({ noteHistoryController, onSelectRevision }) => {
  const { sessionHistory, selectedRevision, selectSessionRevision } = noteHistoryController

  const [listElement, setListElement] = useState<HTMLDivElement | null>(null)

  useListKeyboardNavigation(listElement)

  const sessionHistoryLength = useMemo(
    () => sessionHistory?.map((group) => group.entries).flat().length,
    [sessionHistory],
  )

  return (
    <div
      className={`flex h-full w-full flex-col focus:shadow-none ${
        !sessionHistoryLength ? 'items-center justify-center' : ''
      }`}
      ref={setListElement}
    >
      {sessionHistory?.map((group) => {
        if (group.entries && group.entries.length) {
          return (
            <Fragment key={group.title}>
              <div className="mb-1 mt-2.5 select-none px-3 text-sm font-semibold uppercase text-passive-0">
                {group.title}
              </div>
              {group.entries.map((entry, index) => (
                <HistoryListItem
                  key={index}
                  isSelected={selectedRevision?.payload.updated_at === entry.payload.updated_at}
                  onClick={() => {
                    selectSessionRevision(entry)
                    onSelectRevision()
                  }}
                >
                  {entry.previewTitle()}
                </HistoryListItem>
              ))}
            </Fragment>
          )
        } else {
          return null
        }
      })}
      {!sessionHistoryLength && <div className="select-none text-sm text-passive-0">No session history found</div>}
    </div>
  )
}

export default observer(SessionHistoryList)
