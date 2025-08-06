import TagsList from '@/Components/Tags/TagsList'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
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
