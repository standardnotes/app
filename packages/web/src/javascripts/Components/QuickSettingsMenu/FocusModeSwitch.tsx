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
      <button
        className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={toggle}
      >
        <div className="flex items-center">
          <Icon type="menu-close" className="mr-2 text-neutral" />
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
