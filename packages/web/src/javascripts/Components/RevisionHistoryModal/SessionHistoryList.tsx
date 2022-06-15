import { Fragment, FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import HistoryListItem from './HistoryListItem'
import { HistoryModalController } from '@/Controllers/HistoryModalController'
import { observer } from 'mobx-react-lite'

type Props = {
  historyModalController: HistoryModalController
}

const SessionHistoryList: FunctionComponent<Props> = ({ historyModalController }) => {
  const { sessionHistory, selectSessionRevision, clearSelection } = historyModalController

  const sessionHistoryListRef = useRef<HTMLDivElement>(null)

  useListKeyboardNavigation(sessionHistoryListRef)

  const sessionHistoryLength = useMemo(
    () => sessionHistory?.map((group) => group.entries).flat().length,
    [sessionHistory],
  )

  const [selectedItemCreatedAt, setSelectedItemCreatedAt] = useState<Date>()

  const firstEntry = useMemo(() => {
    return sessionHistory?.find((group) => group.entries?.length)?.entries?.[0]
  }, [sessionHistory])

  const selectFirstEntry = useCallback(() => {
    if (firstEntry) {
      setSelectedItemCreatedAt(firstEntry.payload.created_at)
      selectSessionRevision(firstEntry)
    }
  }, [firstEntry, selectSessionRevision])

  useEffect(() => {
    if (firstEntry && !selectedItemCreatedAt) {
      selectFirstEntry()
    } else if (!firstEntry) {
      clearSelection()
    }
  }, [clearSelection, firstEntry, selectFirstEntry, selectedItemCreatedAt])

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
                  isSelected={selectedItemCreatedAt === entry.payload.created_at}
                  onClick={() => {
                    setSelectedItemCreatedAt(entry.payload.created_at)
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
