import TagsList from '@/Components/Tags/TagsList'
import { ApplicationEvent } from '@/__mocks__/@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import TagsSectionAddButton from './TagsSectionAddButton'
import TagsSectionTitle from './TagsSectionTitle'
import { useApplication } from '../ApplicationProvider'

const TagsSection: FunctionComponent = () => {
  const application = useApplication()

  const [hasMigration, setHasMigration] = useState<boolean>(false)

  const checkIfMigrationNeeded = useCallback(() => {
    setHasMigration(application.items.hasTagsNeedingFoldersMigration())
  }, [application])

  useEffect(() => {
    const removeObserver = application.addEventObserver(async (event) => {
      const events = [ApplicationEvent.CompletedInitialSync, ApplicationEvent.SignedIn]
      if (events.includes(event)) {
        checkIfMigrationNeeded()
      }
    })

    return () => {
      removeObserver()
    }
  }, [application, checkIfMigrationNeeded])

  const runMigration = useCallback(async () => {
    if (
      await application.alerts.confirm(
        '<i>Introducing native, built-in nested tags without requiring the legacy Folders extension.</i><br/></br> ' +
          " To get started, we'll need to migrate any tags containing a dot character to the new system.<br/></br> " +
          ' This migration will convert any tags with dots appearing in their name into a natural' +
          ' hierarchy that is compatible with the new nested tags feature.' +
          ' Running this migration will remove any "." characters appearing in tag names.',
        'New: Folders to Nested Tags',
        'Run Migration',
      )
    ) {
      application.mutator
        .migrateTagsToFolders()
        .then(() => {
          void application.sync.sync()
          checkIfMigrationNeeded()
        })
        .catch(console.error)
    }
  }, [application, checkIfMigrationNeeded])

  return (
    <>
      {application.navigationController.starredTags.length > 0 && (
        <section>
          <div className={'section-title-bar'}>
            <div className="section-title-bar-header">
              <div className="title text-base md:text-sm">
                <span className="font-bold">Favorites</span>
              </div>
            </div>
          </div>
          <TagsList type="favorites" />
        </section>
      )}

      <section>
        <div className={'section-title-bar'}>
          <div className="section-title-bar-header">
            <TagsSectionTitle
              features={application.featuresController}
              hasMigration={hasMigration}
              onClickMigration={runMigration}
            />
            {!application.navigationController.isSearching && (
              <TagsSectionAddButton tags={application.navigationController} features={application.featuresController} />
            )}
          </div>
        </div>
        <TagsList type="all" />
      </section>
    </>
  )
}

export default observer(TagsSection)
