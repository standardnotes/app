import IconButton from '@/Components/Button/IconButton'
import TagsList from '@/Components/Tags/TagsList'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import TagsSectionAddButton from './TagsSectionAddButton'
import TagsSectionTitle from './TagsSectionTitle'
import { useApplication } from '../ApplicationProvider'

const TagsSection: FunctionComponent = () => {
  const application = useApplication()

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
            <TagsSectionTitle features={application.featuresController} />
            {!application.navigationController.isSearching && (
              <div className="flex flex-row items-center gap-1.5">
                <IconButton
                  focusable={true}
                  icon={"collapse-all" as any}
                  title="Collapse all folders"
                  className="p-0 text-neutral hover:text-text transition-colors duration-150"
                  onClick={() => application.navigationController.collapseAllTags()}
                />
                <IconButton
                  focusable={true}
                  icon={"expand-all" as any}
                  title="Expand all folders"
                  className="p-0 text-neutral hover:text-text transition-colors duration-150"
                  onClick={() => application.navigationController.expandAllTags()}
                />
                <TagsSectionAddButton />
              </div>
            )}
          </div>
        </div>
        <TagsList type="all" />
      </section>
    </>
  )
}

export default observer(TagsSection)
