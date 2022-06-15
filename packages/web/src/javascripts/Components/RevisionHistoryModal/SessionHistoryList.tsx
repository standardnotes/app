import { Fragment, FunctionComponent, useMemo, useRef } from 'react'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import HistoryListItem from './HistoryListItem'
import { HistoryModalController } from '@/Controllers/HistoryModalController'
import { observer } from 'mobx-react-lite'

type Props = {
  historyModalController: HistoryModalController
}

const SessionHistoryList: FunctionComponent<Props> = ({ historyModalController }) => {
  const { sessionHistory, selectedRevision, selectSessionRevision } = historyModalController

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
                  isSelected={selectedRevision?.payload.created_at === entry.payload.created_at}
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
