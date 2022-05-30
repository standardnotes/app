import { TAG_FOLDERS_FEATURE_NAME, TAG_FOLDERS_FEATURE_TOOLTIP } from '@/Constants'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { FeaturesState } from '@/UIModels/AppState/FeaturesState'
import { Tooltip } from '@reach/tooltip'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'

type Props = {
  features: FeaturesState
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
        <div className="sk-h3 title">
          <span className="sk-bold">Folders</span>
          {hasMigration && (
            <label className="ml-1 sk-bold color-info cursor-pointer" onClick={onClickMigration}>
              Migration Available
            </label>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="sk-h3 title">
        <span className="sk-bold">Tags</span>
        <Tooltip label={TAG_FOLDERS_FEATURE_TOOLTIP}>
          <label className="ml-1 sk-bold color-passive-2 cursor-pointer" onClick={showPremiumAlert}>
            Folders
          </label>
        </Tooltip>
      </div>
    </>
  )
}

export default observer(TagsSectionTitle)
