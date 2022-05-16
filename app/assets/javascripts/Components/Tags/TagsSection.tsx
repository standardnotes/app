import { TagsList } from '@/Components/Tags/TagsList'
import { AppState } from '@/UIModels/AppState'
import { ApplicationEvent } from '@/__mocks__/@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { TagsSectionAddButton } from './TagsSectionAddButton'
import { TagsSectionTitle } from './TagsSectionTitle'

type Props = {
  appState: AppState
}

export const TagsSection: FunctionComponent<Props> = observer(({ appState }) => {
  const [hasMigration, setHasMigration] = useState<boolean>(false)

  const checkIfMigrationNeeded = useCallback(() => {
    setHasMigration(appState.application.items.hasTagsNeedingFoldersMigration())
  }, [appState])

  useEffect(() => {
    const removeObserver = appState.application.addEventObserver(async (event) => {
      const events = [ApplicationEvent.CompletedInitialSync, ApplicationEvent.SignedIn]
      if (events.includes(event)) {
        checkIfMigrationNeeded()
      }
    })

    return () => {
      removeObserver()
    }
  }, [appState, checkIfMigrationNeeded])

  const runMigration = useCallback(async () => {
    if (
      await appState.application.alertService.confirm(
        '<i>Introducing native, built-in nested tags without requiring the legacy Folders extension.</i><br/></br> ' +
          " To get started, we'll need to migrate any tags containing a dot character to the new system.<br/></br> " +
          ' This migration will convert any tags with dots appearing in their name into a natural' +
          ' hierarchy that is compatible with the new nested tags feature.' +
          ' Running this migration will remove any "." characters appearing in tag names.',
        'New: Folders to Nested Tags',
        'Run Migration',
      )
    ) {
      appState.application.mutator
        .migrateTagsToFolders()
        .then(() => {
          checkIfMigrationNeeded()
        })
        .catch(console.error)
    }
  }, [appState, checkIfMigrationNeeded])

  return (
    <section>
      <div className="section-title-bar">
        <div className="section-title-bar-header">
          <TagsSectionTitle features={appState.features} hasMigration={hasMigration} onClickMigration={runMigration} />
          <TagsSectionAddButton tags={appState.tags} features={appState.features} />
        </div>
      </div>
      <TagsList appState={appState} />
    </section>
  )
})
