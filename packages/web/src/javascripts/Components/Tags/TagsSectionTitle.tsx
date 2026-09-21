import { getTagFoldersFeatureName, getTagFoldersFeatureTooltip } from '@/Constants/Constants'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import StyledTooltip from '../StyledTooltip/StyledTooltip'
import { c } from 'ttag'
import { localizationStore } from '@/Controllers/Localization/LocalizationStore'

type Props = {
  features: FeaturesController
}

const TagsSectionTitle: FunctionComponent<Props> = ({ features }) => {
  void localizationStore.currentLocale

  const entitledToFolders = features.hasFolders
  const modal = usePremiumModal()

  const showPremiumAlert = useCallback(() => {
    modal.activate(getTagFoldersFeatureName())
  }, [modal])

  if (entitledToFolders) {
    return (
      <>
        <div className="title text-base md:text-sm">
          <span className="font-bold">{c('B4.Notes.TagsLinkedItems.Label').t`Folders`}</span>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="title text-base md:text-sm">
        <span className="font-bold">{c('B4.Notes.TagsLinkedItems.Label').t`Tags`}</span>
        <StyledTooltip label={getTagFoldersFeatureTooltip()}>
          <label className="ml-1 cursor-pointer font-bold text-passive-2" onClick={showPremiumAlert}>
            {c('B4.Notes.TagsLinkedItems.Label').t`Folders`}
          </label>
        </StyledTooltip>
      </div>
    </>
  )
}

export default observer(TagsSectionTitle)
