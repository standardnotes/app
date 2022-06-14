import { WebApplication } from '@/Application/Application'
import { HistoryModalController } from '@/Controllers/HistoryModalController'
import { Action, HistoryEntry, RevisionListEntry, SNNote } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, SetStateAction, Dispatch } from 'react'
import LegacyHistoryList from './LegacyHistoryList'
import RemoteHistoryList from './RemoteHistoryList'
import { RevisionListTab } from './RevisionListTabType'
import SessionHistoryList from './SessionHistoryList'

type Props = {
  application: WebApplication
  historyModalController: HistoryModalController
  note: SNNote
  setIsFetchingSelectedRevision: Dispatch<SetStateAction<boolean>>
  setShowContentLockedScreen: Dispatch<SetStateAction<boolean>>
}

const HistoryListContainer: FunctionComponent<Props> = ({
  application,
  historyModalController,
  note,
  setIsFetchingSelectedRevision,
  setShowContentLockedScreen,
}) => {
  const { legacyHistory, currentTab, setCurrentTab, setSelectedRevision, setSelectedRemoteEntry } =
    historyModalController

  const TabButton: FunctionComponent<{
    type: RevisionListTab
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

  const fetchAndSetRemoteRevision = useCallback(
    async (revisionListEntry: RevisionListEntry) => {
      setShowContentLockedScreen(false)

      if (application.features.hasMinimumRole(revisionListEntry.required_role)) {
        setIsFetchingSelectedRevision(true)
        setSelectedRevision(undefined)
        setSelectedRemoteEntry(undefined)

        try {
          const remoteRevision = await application.historyManager.fetchRemoteRevision(note, revisionListEntry)
          setSelectedRevision(remoteRevision)
          setSelectedRemoteEntry(revisionListEntry)
        } catch (err) {
          console.error(err)
        } finally {
          setIsFetchingSelectedRevision(false)
        }
      } else {
        setShowContentLockedScreen(true)
        setSelectedRevision(undefined)
      }
    },
    [
      application,
      note,
      setIsFetchingSelectedRevision,
      setSelectedRemoteEntry,
      setSelectedRevision,
      setShowContentLockedScreen,
    ],
  )

  return (
    <div className={'flex flex-col min-w-60 border-0 border-r-1px border-solid border-main overflow-auto h-full'}>
      <div className="flex border-0 border-b-1 border-solid border-main">
        <TabButton type={RevisionListTab.Remote} />
        <TabButton type={RevisionListTab.Session} />
        {legacyHistory && legacyHistory.length > 0 && <TabButton type={RevisionListTab.Legacy} />}
      </div>
      <div className={'min-h-0 overflow-auto py-1.5 h-full'}>
        {currentTab === RevisionListTab.Session && (
          <SessionHistoryList historyModalController={historyModalController} />
        )}
        {currentTab === RevisionListTab.Remote && (
          <RemoteHistoryList
            application={application}
            historyModalController={historyModalController}
            fetchAndSetRemoteRevision={fetchAndSetRemoteRevision}
          />
        )}
        {currentTab === RevisionListTab.Legacy && (
          <LegacyHistoryList
            legacyHistory={legacyHistory}
            historyModalController={historyModalController}
            fetchAndSetLegacyRevision={fetchAndSetLegacyRevision}
          />
        )}
      </div>
    </div>
  )
}

export default observer(HistoryListContainer)
