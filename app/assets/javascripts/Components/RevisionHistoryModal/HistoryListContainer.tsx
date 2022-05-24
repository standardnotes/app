import { WebApplication } from '@/UIModels/Application'
import { Action, ActionVerb, HistoryEntry, NoteHistoryEntry, RevisionListEntry, SNNote } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useState, useEffect, SetStateAction, Dispatch } from 'react'
import { LegacyHistoryList } from './LegacyHistoryList'
import { RemoteHistoryList } from './RemoteHistoryList'
import { SessionHistoryList } from './SessionHistoryList'
import { LegacyHistoryEntry, RemoteRevisionListGroup, sortRevisionListIntoGroups } from './utils'

export enum RevisionListTabType {
  Session = 'Session',
  Remote = 'Remote',
  Legacy = 'Legacy',
}

type Props = {
  application: WebApplication
  isFetchingRemoteHistory: boolean
  note: SNNote
  remoteHistory: RemoteRevisionListGroup[] | undefined
  setIsFetchingSelectedRevision: Dispatch<SetStateAction<boolean>>
  setSelectedRemoteEntry: Dispatch<SetStateAction<RevisionListEntry | undefined>>
  setSelectedRevision: Dispatch<SetStateAction<HistoryEntry | LegacyHistoryEntry | undefined>>
  setShowContentLockedScreen: Dispatch<SetStateAction<boolean>>
}

export const HistoryListContainer: FunctionComponent<Props> = observer(
  ({
    application,
    isFetchingRemoteHistory,
    note,
    remoteHistory,
    setIsFetchingSelectedRevision,
    setSelectedRemoteEntry,
    setSelectedRevision,
    setShowContentLockedScreen,
  }) => {
    const sessionHistory = sortRevisionListIntoGroups<NoteHistoryEntry>(
      application.historyManager.sessionHistoryForItem(note) as NoteHistoryEntry[],
    )
    const [legacyHistory, setLegacyHistory] = useState<Action[]>()

    const [selectedTab, setSelectedTab] = useState<RevisionListTabType>(RevisionListTabType.Remote)

    useEffect(() => {
      const fetchLegacyHistory = async () => {
        const actionExtensions = application.actionsManager.getExtensions()
        actionExtensions.forEach(async (ext) => {
          const actionExtension = await application.actionsManager.loadExtensionInContextOfItem(ext, note)

          if (!actionExtension) {
            return
          }

          const isLegacyNoteHistoryExt = actionExtension?.actions.some((action) => action.verb === ActionVerb.Nested)

          if (!isLegacyNoteHistoryExt) {
            return
          }

          const legacyHistoryEntries = actionExtension.actions.filter((action) => action.subactions?.[0])

          setLegacyHistory(legacyHistoryEntries)
        })
      }

      fetchLegacyHistory().catch(console.error)
    }, [application, note])

    const TabButton: FunctionComponent<{
      type: RevisionListTabType
    }> = ({ type }) => {
      const isSelected = selectedTab === type

      return (
        <button
          className={`bg-default border-0 cursor-pointer px-3 py-2.5 relative focus:shadow-inner ${
            isSelected ? 'color-info font-medium shadow-bottom' : 'color-text'
          }`}
          onClick={() => {
            setSelectedTab(type)
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
          <TabButton type={RevisionListTabType.Remote} />
          <TabButton type={RevisionListTabType.Session} />
          {legacyHistory && legacyHistory.length > 0 && <TabButton type={RevisionListTabType.Legacy} />}
        </div>
        <div className={'min-h-0 overflow-auto py-1.5 h-full'}>
          {selectedTab === RevisionListTabType.Session && (
            <SessionHistoryList
              sessionHistory={sessionHistory}
              setSelectedRevision={setSelectedRevision}
              setSelectedRemoteEntry={setSelectedRemoteEntry}
            />
          )}
          {selectedTab === RevisionListTabType.Remote && (
            <RemoteHistoryList
              application={application}
              remoteHistory={remoteHistory}
              isFetchingRemoteHistory={isFetchingRemoteHistory}
              fetchAndSetRemoteRevision={fetchAndSetRemoteRevision}
            />
          )}
          {selectedTab === RevisionListTabType.Legacy && (
            <LegacyHistoryList
              legacyHistory={legacyHistory}
              setSelectedRevision={setSelectedRevision}
              setSelectedRemoteEntry={setSelectedRemoteEntry}
              fetchAndSetLegacyRevision={fetchAndSetLegacyRevision}
            />
          )}
        </div>
      </div>
    )
  },
)
