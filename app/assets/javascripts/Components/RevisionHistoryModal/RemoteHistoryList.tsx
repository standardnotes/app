import { WebApplication } from '@/UIModels/Application'
import { RevisionListEntry } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { Fragment, FunctionComponent } from 'preact'
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { Icon } from '@/Components/Icon/Icon'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import { HistoryListItem } from './HistoryListItem'
import { previewHistoryEntryTitle, RemoteRevisionListGroup } from './utils'

type RemoteHistoryListProps = {
  application: WebApplication
  remoteHistory: RemoteRevisionListGroup[] | undefined
  isFetchingRemoteHistory: boolean
  fetchAndSetRemoteRevision: (revisionListEntry: RevisionListEntry) => Promise<void>
}

export const RemoteHistoryList: FunctionComponent<RemoteHistoryListProps> = observer(
  ({ application, remoteHistory, isFetchingRemoteHistory, fetchAndSetRemoteRevision }) => {
    const remoteHistoryListRef = useRef<HTMLDivElement>(null)

    useListKeyboardNavigation(remoteHistoryListRef)

    const remoteHistoryLength = useMemo(
      () => remoteHistory?.map((group) => group.entries).flat().length,
      [remoteHistory],
    )

    const [selectedEntryUuid, setSelectedEntryUuid] = useState('')

    const firstEntry = useMemo(() => {
      return remoteHistory?.find((group) => group.entries?.length)?.entries?.[0]
    }, [remoteHistory])

    const selectFirstEntry = useCallback(() => {
      if (firstEntry) {
        setSelectedEntryUuid(firstEntry.uuid)
        fetchAndSetRemoteRevision(firstEntry).catch(console.error)
      }
    }, [fetchAndSetRemoteRevision, firstEntry])

    useEffect(() => {
      if (firstEntry && !selectedEntryUuid.length) {
        selectFirstEntry()
      }
    }, [fetchAndSetRemoteRevision, firstEntry, remoteHistory, selectFirstEntry, selectedEntryUuid.length])

    return (
      <div
        className={`flex flex-col w-full h-full focus:shadow-none ${
          isFetchingRemoteHistory || !remoteHistoryLength ? 'items-center justify-center' : ''
        }`}
        ref={remoteHistoryListRef}
      >
        {isFetchingRemoteHistory && <div className="sk-spinner w-5 h-5 spinner-info"></div>}
        {remoteHistory?.map((group) => {
          if (group.entries && group.entries.length) {
            return (
              <Fragment key={group.title}>
                <div className="px-3 mt-2.5 mb-1 font-semibold color-text uppercase color-passive-0 select-none">
                  {group.title}
                </div>
                {group.entries.map((entry) => (
                  <HistoryListItem
                    key={entry.uuid}
                    isSelected={selectedEntryUuid === entry.uuid}
                    onClick={() => {
                      setSelectedEntryUuid(entry.uuid)
                      fetchAndSetRemoteRevision(entry).catch(console.error)
                    }}
                  >
                    <div className="flex flex-grow items-center justify-between">
                      <div>{previewHistoryEntryTitle(entry)}</div>
                      {!application.features.hasMinimumRole(entry.required_role) && <Icon type="premium-feature" />}
                    </div>
                  </HistoryListItem>
                ))}
              </Fragment>
            )
          } else {
            return null
          }
        })}
        {!remoteHistoryLength && !isFetchingRemoteHistory && (
          <div className="color-passive-0 select-none">No remote history found</div>
        )}
      </div>
    )
  },
)
