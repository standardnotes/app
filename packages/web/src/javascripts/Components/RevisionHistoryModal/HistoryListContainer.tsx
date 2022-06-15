import { WebApplication } from '@/Application/Application'
import { HistoryModalController } from '@/Controllers/HistoryModalController'
import { Action, HistoryEntry, SNNote } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import LegacyHistoryList from './LegacyHistoryList'
import RemoteHistoryList from './RemoteHistoryList'
import { RevisionType } from './RevisionType'
import SessionHistoryList from './SessionHistoryList'

type Props = {
  application: WebApplication
  historyModalController: HistoryModalController
  note: SNNote
}

const HistoryListContainer: FunctionComponent<Props> = ({ application, historyModalController, note }) => {
  const {
    legacyHistory,
    currentTab,
    setCurrentTab,
    setSelectedRevision,
    setSelectedRemoteEntry,
    setIsFetchingSelectedRevision,
  } = historyModalController

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
          setCurrentTab(type)
          setSelectedRemoteEntry(undefined)
        }}
      >
        {type}
      </button>
    )
  }

  const fetchAndSetLegacyRevision = useCallback(
    async (revisionListEntry: Action) => {
      setSelectedRemoteEntry(undefined)
      setSelectedRevision(undefined)
      setIsFetchingSelectedRevision(true)

      try {
        if (!revisionListEntry.subactions?.[0]) {
          throw new Error('Could not find revision action url')
        }

        const response = await application.actionsManager.runAction(revisionListEntry.subactions[0], note)

        if (!response) {
          throw new Error('Could not fetch revision')
        }

        setSelectedRevision(response.item as unknown as HistoryEntry)
      } catch (error) {
        console.error(error)
        setSelectedRevision(undefined)
      } finally {
        setIsFetchingSelectedRevision(false)
      }
    },
    [application.actionsManager, note, setIsFetchingSelectedRevision, setSelectedRemoteEntry, setSelectedRevision],
  )

  return (
    <div className={'flex flex-col min-w-60 border-0 border-r-1px border-solid border-main overflow-auto h-full'}>
      <div className="flex border-0 border-b-1 border-solid border-main">
        <TabButton type={RevisionType.Remote} />
        <TabButton type={RevisionType.Session} />
        {legacyHistory && legacyHistory.length > 0 && <TabButton type={RevisionType.Legacy} />}
      </div>
      <div className={'min-h-0 overflow-auto py-1.5 h-full'}>
        {currentTab === RevisionType.Session && <SessionHistoryList historyModalController={historyModalController} />}
        {currentTab === RevisionType.Remote && (
          <RemoteHistoryList application={application} historyModalController={historyModalController} />
        )}
        {currentTab === RevisionType.Legacy && (
          <LegacyHistoryList legacyHistory={legacyHistory} historyModalController={historyModalController} />
        )}
      </div>
    </div>
  )
}

export default observer(HistoryListContainer)
