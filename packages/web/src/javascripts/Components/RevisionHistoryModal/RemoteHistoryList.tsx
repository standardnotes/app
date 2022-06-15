import { observer } from 'mobx-react-lite'
import { Fragment, FunctionComponent, useMemo, useRef } from 'react'
import Icon from '@/Components/Icon/Icon'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import HistoryListItem from './HistoryListItem'
import { previewHistoryEntryTitle } from './utils'
import { HistoryModalController } from '@/Controllers/HistoryModalController'
import { FeaturesClientInterface } from '@standardnotes/snjs/dist/@types'

type RemoteHistoryListProps = {
  hasMinimumRole: FeaturesClientInterface['hasMinimumRole']
  historyModalController: HistoryModalController
}

const RemoteHistoryList: FunctionComponent<RemoteHistoryListProps> = ({ hasMinimumRole, historyModalController }) => {
  const { remoteHistory, isFetchingRemoteHistory, selectRemoteRevision, selectedRemoteEntry } = historyModalController

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
                  isSelected={selectedRemoteEntry?.uuid === entry.uuid}
                  onClick={() => {
                    selectRemoteRevision(entry)
                  }}
                >
                  <div className="flex flex-grow items-center justify-between">
                    <div>{previewHistoryEntryTitle(entry)}</div>
                    {!hasMinimumRole(entry.required_role) && <Icon type="premium-feature" />}
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
