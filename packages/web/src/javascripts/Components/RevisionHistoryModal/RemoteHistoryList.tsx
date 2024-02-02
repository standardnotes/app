import { observer } from 'mobx-react-lite'
import { Fragment, FunctionComponent, useMemo, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import HistoryListItem from './HistoryListItem'
import { previewHistoryEntryTitle } from './utils'
import { FeaturesClientInterface, RevisionMetadata } from '@standardnotes/snjs'
import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'
import Spinner from '@/Components/Spinner/Spinner'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'

type RemoteHistoryListProps = {
  features: FeaturesClientInterface
  noteHistoryController: NoteHistoryController
  onSelectRevision: () => void
}

const RemoteHistoryList: FunctionComponent<RemoteHistoryListProps> = ({
  features,
  noteHistoryController,
  onSelectRevision,
}) => {
  const { remoteHistory, isFetchingRemoteHistory, selectRemoteRevision, selectedEntry } = noteHistoryController

  const [listElement, setListElement] = useState<HTMLDivElement | null>(null)

  useListKeyboardNavigation(listElement)

  const remoteHistoryLength = useMemo(() => remoteHistory?.map((group) => group.entries).flat().length, [remoteHistory])

  return (
    <div
      className={`flex h-full w-full flex-col focus:shadow-none ${
        isFetchingRemoteHistory || !remoteHistoryLength ? 'items-center justify-center' : ''
      }`}
      ref={setListElement}
    >
      {isFetchingRemoteHistory && <Spinner className="h-5 w-5" />}
      {remoteHistory?.map((group) => {
        if (group.entries && group.entries.length) {
          return (
            <Fragment key={group.title}>
              <div className="mb-1 mt-2.5 select-none px-3 text-sm font-semibold uppercase text-passive-0">
                {group.title}
              </div>
              {group.entries.map((entry) => (
                <HistoryListItem
                  key={entry.uuid}
                  isSelected={(selectedEntry as RevisionMetadata)?.uuid === entry.uuid}
                  onClick={() => {
                    void selectRemoteRevision(entry)
                    onSelectRevision()
                  }}
                >
                  <div className="flex flex-grow items-center justify-between">
                    <div>{previewHistoryEntryTitle(entry)}</div>
                    {!features.hasMinimumRole(entry.required_role) && (
                      <Icon type={PremiumFeatureIconName} className={PremiumFeatureIconClass} />
                    )}
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
        <div className="select-none text-sm text-passive-0">No remote history found</div>
      )}
    </div>
  )
}

export default observer(RemoteHistoryList)
