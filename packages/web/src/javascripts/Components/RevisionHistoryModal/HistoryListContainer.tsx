import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'
import { FeaturesClientInterface } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import LegacyHistoryList from './LegacyHistoryList'
import RemoteHistoryList from './RemoteHistoryList'
import { RevisionType } from './RevisionType'
import SessionHistoryList from './SessionHistoryList'
import { HistoryModalMobileTab } from './utils'

type Props = {
  features: FeaturesClientInterface
  noteHistoryController: NoteHistoryController
  selectMobileModalTab: (tab: HistoryModalMobileTab) => void
}

const HistoryListContainer: FunctionComponent<Props> = ({ features, noteHistoryController, selectMobileModalTab }) => {
  const { legacyHistory, currentTab, selectTab } = noteHistoryController

  const TabButton: FunctionComponent<{
    type: RevisionType
  }> = ({ type }) => {
    const isSelected = currentTab === type

    return (
      <button
        className={`relative cursor-pointer border-0 bg-default px-3 py-2.5 text-sm focus:shadow-inner ${
          isSelected ? 'font-medium text-info shadow-bottom' : 'text-text'
        }`}
        onClick={() => {
          selectTab(type)
        }}
      >
        {type}
      </button>
    )
  }

  const onSelectRevision = useCallback(() => {
    selectMobileModalTab('Content')
  }, [selectMobileModalTab])

  const CurrentTabList = () => {
    switch (currentTab) {
      case RevisionType.Remote:
        return (
          <RemoteHistoryList
            onSelectRevision={onSelectRevision}
            features={features}
            noteHistoryController={noteHistoryController}
          />
        )
      case RevisionType.Session:
        return <SessionHistoryList onSelectRevision={onSelectRevision} noteHistoryController={noteHistoryController} />
      case RevisionType.Legacy:
        return (
          <LegacyHistoryList
            onSelectRevision={onSelectRevision}
            legacyHistory={legacyHistory}
            noteHistoryController={noteHistoryController}
          />
        )
    }
  }

  return (
    <div className={'flex h-full flex-grow flex-col overflow-auto border-r border-solid border-border'}>
      <div className="flex border-b border-solid border-border">
        <TabButton type={RevisionType.Remote} />
        <TabButton type={RevisionType.Session} />
        {legacyHistory && legacyHistory.length > 0 && <TabButton type={RevisionType.Legacy} />}
      </div>
      <div className={'h-full min-h-0 overflow-auto py-1.5'}>
        <CurrentTabList />
      </div>
    </div>
  )
}

export default observer(HistoryListContainer)
