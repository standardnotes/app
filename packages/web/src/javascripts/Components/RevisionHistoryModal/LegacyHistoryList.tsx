import { Action } from '@standardnotes/snjs'
import { FunctionComponent, useRef } from 'react'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import HistoryListItem from './HistoryListItem'
import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'

type Props = {
  legacyHistory: Action[] | undefined
  noteHistoryController: NoteHistoryController
  onSelectRevision: () => void
}

const LegacyHistoryList: FunctionComponent<Props> = ({ legacyHistory, noteHistoryController, onSelectRevision }) => {
  const { selectLegacyRevision, selectedEntry } = noteHistoryController

  const legacyHistoryListRef = useRef<HTMLDivElement>(null)

  useListKeyboardNavigation(legacyHistoryListRef)

  return (
    <div
      className={`flex h-full w-full flex-col focus:shadow-none ${
        !legacyHistory?.length ? 'items-center justify-center' : ''
      }`}
      ref={legacyHistoryListRef}
    >
      {legacyHistory?.map((entry) => {
        const selectedEntryUrl = (selectedEntry as Action)?.subactions?.[0].url
        const url = entry.subactions?.[0].url

        return (
          <HistoryListItem
            key={url}
            isSelected={selectedEntryUrl === url}
            onClick={() => {
              selectLegacyRevision(entry)
              onSelectRevision()
            }}
          >
            {entry.label}
          </HistoryListItem>
        )
      })}
      {!legacyHistory?.length && <div className="select-none text-sm text-passive-0">No legacy history found</div>}
    </div>
  )
}

export default LegacyHistoryList
