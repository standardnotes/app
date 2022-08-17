import TagsList from '@/Components/Tags/TagsList'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { ApplicationEvent } from '@/__mocks__/@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import TagsSectionAddButton from './TagsSectionAddButton'
import TagsSectionTitle from './TagsSectionTitle'

type Props = {
  viewControllerManager: ViewControllerManager
}

const TagsSection: FunctionComponent<Props> = ({ viewControllerManager }) => {
  const [hasMigration, setHasMigration] = useState<boolean>(false)

  const checkIfMigrationNeeded = useCallback(() => {
    setHasMigration(viewControllerManager.application.items.hasTagsNeedingFoldersMigration())
  }, [viewControllerManager])

  useEffect(() => {
    const removeObserver = viewControllerManager.application.addEventObserver(async (event) => {
      const events = [ApplicationEvent.CompletedInitialSync, ApplicationEvent.SignedIn]
      if (events.includes(event)) {
        checkIfMigrationNeeded()
      }
    })

    return () => {
      removeObserver()
    }
  }, [viewControllerManager, checkIfMigrationNeeded])

  const runMigration = useCallback(async () => {
    if (
      await viewControllerManager.application.alertService.confirm(
        '<i>Introducing native, built-in nested tags without requiring the legacy Folders extension.</i><br/></br> ' +
          " To get started, we'll need to migrate any tags containing a dot character to the new system.<br/></br> " +
          ' This migration will convert any tags with dots appearing in their name into a natural' +
          ' hierarchy that is compatible with the new nested tags feature.' +
          ' Running this migration will remove any "." characters appearing in tag names.',
        'New: Folders to Nested Tags',
        'Run Migration',
      )
    ) {
      viewControllerManager.application.mutator
        .migrateTagsToFolders()
        .then(() => {
          checkIfMigrationNeeded()
        })
        .catch(console.error)
    }
  }, [viewControllerManager, checkIfMigrationNeeded])

  return (
    <section>
      <div className={'section-title-bar'}>
        <div className="section-title-bar-header">
          <TagsSectionTitle
            features={viewControllerManager.featuresController}
            hasMigration={hasMigration}
            onClickMigration={runMigration}
          />
          <TagsSectionAddButton
            tags={viewControllerManager.navigationController}
            features={viewControllerManager.featuresController}
          />
        </div>
      </div>
      <TagsList viewControllerManager={viewControllerManager} />
    </section>
  )
}

export default observer(TagsSection)
