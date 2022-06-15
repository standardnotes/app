import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import { Fragment, FunctionComponent, useMemo, useRef } from 'react'
import Icon from '@/Components/Icon/Icon'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import HistoryListItem from './HistoryListItem'
import { previewHistoryEntryTitle } from './utils'
import { HistoryModalController } from '@/Controllers/HistoryModalController'

type RemoteHistoryListProps = {
  application: WebApplication
  historyModalController: HistoryModalController
}

const RemoteHistoryList: FunctionComponent<RemoteHistoryListProps> = ({ application, historyModalController }) => {
  const { remoteHistory, isFetchingRemoteHistory, fetchAndSetRemoteRevision, selectedEntry } = historyModalController

  const remoteHistoryListRef = useRef<HTMLDivElement>(null)

  useListKeyboardNavigation(remoteHistoryListRef)

  const remoteHistoryLength = useMemo(() => remoteHistory?.map((group) => group.entries).flat().length, [remoteHistory])

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
                  isSelected={selectedEntry?.uuid === entry.uuid}
                  onClick={() => {
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
}

export default observer(RemoteHistoryList)
