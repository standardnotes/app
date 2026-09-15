import { TAG_FOLDERS_FEATURE_NAME, TAG_FOLDERS_FEATURE_TOOLTIP } from '@/Constants/Constants'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import StyledTooltip from '../StyledTooltip/StyledTooltip'
import { c } from 'ttag'

type Props = {
  features: FeaturesController
}

const TagsSectionTitle: FunctionComponent<Props> = ({ features }) => {
  const entitledToFolders = features.hasFolders
  const modal = usePremiumModal()

  const showPremiumAlert = useCallback(() => {
    modal.activate(TAG_FOLDERS_FEATURE_NAME)
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
        <StyledTooltip label={TAG_FOLDERS_FEATURE_TOOLTIP}>
          <label className="ml-1 cursor-pointer font-bold text-passive-2" onClick={showPremiumAlert}>
            {c('B4.Notes.TagsLinkedItems.Label').t`Folders`}
          </label>
        </StyledTooltip>
      </div>
    </>
  )
}

export default observer(TagsSectionTitle)
