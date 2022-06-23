import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'
import { FeaturesClientInterface } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import LegacyHistoryList from './LegacyHistoryList'
import RemoteHistoryList from './RemoteHistoryList'
import { RevisionType } from './RevisionType'
import SessionHistoryList from './SessionHistoryList'

type Props = {
  features: FeaturesClientInterface
  noteHistoryController: NoteHistoryController
}

const HistoryListContainer: FunctionComponent<Props> = ({ features, noteHistoryController }) => {
  const { legacyHistory, currentTab, selectTab } = noteHistoryController

  const TabButton: FunctionComponent<{
    type: RevisionType
  }> = ({ type }) => {
    const isSelected = currentTab === type

    return (
      <button
        className={`bg-default border-0 cursor-pointer px-3 py-2.5 relative focus:shadow-inner ${
          isSelected ? 'color-info font-medium shadow-bottom' : 'color-text'
        }`}
        onClick={() => {
          selectTab(type)
        }}
      >
        {type}
      </button>
    )
  }

  const CurrentTabList = () => {
    switch (currentTab) {
      case RevisionType.Remote:
        return <RemoteHistoryList features={features} noteHistoryController={noteHistoryController} />
      case RevisionType.Session:
        return <SessionHistoryList noteHistoryController={noteHistoryController} />
      case RevisionType.Legacy:
        return <LegacyHistoryList legacyHistory={legacyHistory} noteHistoryController={noteHistoryController} />
    }
  }

  return (
    <div className={'flex flex-col min-w-60 border-0 border-r-1px border-solid border-border overflow-auto h-full'}>
      <div className="flex border-0 border-b-1 border-solid border-border">
        <TabButton type={RevisionType.Remote} />
        <TabButton type={RevisionType.Session} />
        {legacyHistory && legacyHistory.length > 0 && <TabButton type={RevisionType.Legacy} />}
      </div>
      <div className={'min-h-0 overflow-auto py-1.5 h-full'}>
        <CurrentTabList />
      </div>
    </div>
  )
}

export default observer(HistoryListContainer)
