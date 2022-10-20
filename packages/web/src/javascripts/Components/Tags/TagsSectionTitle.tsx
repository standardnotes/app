import { TAG_FOLDERS_FEATURE_NAME, TAG_FOLDERS_FEATURE_TOOLTIP } from '@/Constants/Constants'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { Tooltip } from '@reach/tooltip'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'

type Props = {
  features: FeaturesController
  hasMigration: boolean
  onClickMigration: () => void
}

const TagsSectionTitle: FunctionComponent<Props> = ({ features, hasMigration, onClickMigration }) => {
  const entitledToFolders = features.hasFolders
  const modal = usePremiumModal()

  const showPremiumAlert = useCallback(() => {
    modal.activate(TAG_FOLDERS_FEATURE_NAME)
  }, [modal])

  if (entitledToFolders) {
    return (
      <>
        <div className="title text-sm">
          <span className="font-bold">Folders</span>
          {hasMigration && (
            <label className="ml-1 cursor-pointer font-bold text-info" onClick={onClickMigration}>
              Migration Available
            </label>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="title text-sm">
        <span className="font-bold">Tags</span>
        <Tooltip label={TAG_FOLDERS_FEATURE_TOOLTIP}>
          <label className="ml-1 cursor-pointer font-bold text-passive-2" onClick={showPremiumAlert}>
            Folders
          </label>
        </Tooltip>
      </div>
    </>
  )
}

export default observer(TagsSectionTitle)
