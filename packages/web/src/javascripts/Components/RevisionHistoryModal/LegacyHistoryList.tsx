import { Action } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import HistoryListItem from './HistoryListItem'
import { HistoryModalController } from '@/Controllers/HistoryModalController'

type Props = {
  legacyHistory: Action[] | undefined
  historyModalController: HistoryModalController
  fetchAndSetLegacyRevision: (revisionListEntry: Action) => Promise<void>
}

const LegacyHistoryList: FunctionComponent<Props> = ({
  legacyHistory,
  historyModalController,
  fetchAndSetLegacyRevision,
}) => {
  const { setSelectedRevision, setSelectedRemoteEntry } = historyModalController

  const legacyHistoryListRef = useRef<HTMLDivElement>(null)

  useListKeyboardNavigation(legacyHistoryListRef)

  const [selectedItemUrl, setSelectedItemUrl] = useState<string>()

  const firstEntry = useMemo(() => {
    return legacyHistory?.[0]
  }, [legacyHistory])

  const selectFirstEntry = useCallback(() => {
    if (firstEntry) {
      setSelectedItemUrl(firstEntry.subactions?.[0].url)
      setSelectedRevision(undefined)
      fetchAndSetLegacyRevision(firstEntry).catch(console.error)
    }
  }, [fetchAndSetLegacyRevision, firstEntry, setSelectedRevision])

  useEffect(() => {
    if (firstEntry && !selectedItemUrl) {
      selectFirstEntry()
    } else if (!firstEntry) {
      setSelectedRevision(undefined)
    }
  }, [firstEntry, selectFirstEntry, selectedItemUrl, setSelectedRevision])

  return (
    <div
      className={`flex flex-col w-full h-full focus:shadow-none ${
        !legacyHistory?.length ? 'items-center justify-center' : ''
      }`}
      ref={legacyHistoryListRef}
    >
      {legacyHistory?.map((entry) => {
        const url = entry.subactions?.[0].url

        return (
          <HistoryListItem
            key={url}
            isSelected={selectedItemUrl === url}
            onClick={() => {
              setSelectedItemUrl(url)
              setSelectedRemoteEntry(undefined)
              fetchAndSetLegacyRevision(entry).catch(console.error)
            }}
          >
            {entry.label}
          </HistoryListItem>
        )
      })}
      {!legacyHistory?.length && <div className="color-passive-0 select-none">No legacy history found</div>}
    </div>
  )
}

export default LegacyHistoryList
