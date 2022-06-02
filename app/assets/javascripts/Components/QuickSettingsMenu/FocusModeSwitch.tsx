import { WebApplication } from '@/Application/Application'
import { FeatureStatus, FeatureIdentifier } from '@standardnotes/snjs'
import { FunctionComponent, MouseEventHandler, useCallback } from 'react'
import Icon from '@/Components/Icon/Icon'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import Switch from '@/Components/Switch/Switch'

type Props = {
  application: WebApplication
  onToggle: (value: boolean) => void
  onClose: () => void
  isEnabled: boolean
}

const FocusModeSwitch: FunctionComponent<Props> = ({ application, onToggle, onClose, isEnabled }) => {
  const premiumModal = usePremiumModal()
  const isEntitled = application.features.getFeatureStatus(FeatureIdentifier.FocusMode) === FeatureStatus.Entitled

  const toggle: MouseEventHandler = useCallback(
    (e) => {
      e.preventDefault()

      if (isEntitled) {
        onToggle(!isEnabled)
        onClose()
      } else {
        premiumModal.activate('Focused Writing')
      }
    },
    [isEntitled, onToggle, isEnabled, onClose, premiumModal],
  )

  return (
    <>
      <button className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none justify-between" onClick={toggle}>
        <div className="flex items-center">
          <Icon type="menu-close" className="color-neutral mr-2" />
          Focused Writing
        </div>
        {isEntitled ? (
          <Switch className="px-0" checked={isEnabled} />
        ) : (
          <div title="Premium feature">
            <Icon type="premium-feature" />
          </div>
        )}
      </button>
    </>
  )
}

export default FocusModeSwitch
