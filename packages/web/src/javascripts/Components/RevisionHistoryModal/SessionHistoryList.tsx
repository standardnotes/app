import { Fragment, FunctionComponent, useMemo, useRef } from 'react'
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

  const sessionHistoryListRef = useRef<HTMLDivElement>(null)

  useListKeyboardNavigation(sessionHistoryListRef)

  const sessionHistoryLength = useMemo(
    () => sessionHistory?.map((group) => group.entries).flat().length,
    [sessionHistory],
  )

  return (
    <div
      className={`flex h-full w-full flex-col focus:shadow-none ${
        !sessionHistoryLength ? 'items-center justify-center' : ''
      }`}
      ref={sessionHistoryListRef}
    >
      {sessionHistory?.map((group) => {
        if (group.entries && group.entries.length) {
          return (
            <Fragment key={group.title}>
              <div className="mt-2.5 mb-1 select-none px-3 text-sm font-semibold uppercase text-passive-0">
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
