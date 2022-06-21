import { Fragment, FunctionComponent, useMemo, useRef } from 'react'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import HistoryListItem from './HistoryListItem'
import { observer } from 'mobx-react-lite'
import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'

type Props = {
  noteHistoryController: NoteHistoryController
}

const SessionHistoryList: FunctionComponent<Props> = ({ noteHistoryController }) => {
  const { sessionHistory, selectedRevision, selectSessionRevision } = noteHistoryController

  const sessionHistoryListRef = useRef<HTMLDivElement>(null)

  useListKeyboardNavigation(sessionHistoryListRef)

  const sessionHistoryLength = useMemo(
    () => sessionHistory?.map((group) => group.entries).flat().length,
    [sessionHistory],
  )

  return (
    <div
      className={`flex flex-col w-full h-full focus:shadow-none ${
        !sessionHistoryLength ? 'items-center justify-center' : ''
      }`}
      ref={sessionHistoryListRef}
    >
      {sessionHistory?.map((group) => {
        if (group.entries && group.entries.length) {
          return (
            <Fragment key={group.title}>
              <div className="px-3 mt-2.5 mb-1 font-semibold color-text uppercase color-passive-0 select-none">
                {group.title}
              </div>
              {group.entries.map((entry, index) => (
                <HistoryListItem
                  key={index}
                  isSelected={selectedRevision?.payload.updated_at === entry.payload.updated_at}
                  onClick={() => {
                    selectSessionRevision(entry)
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
      {!sessionHistoryLength && <div className="color-passive-0 select-none">No session history found</div>}
    </div>
  )
}

export default observer(SessionHistoryList)
