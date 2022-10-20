import { WebApplication } from '@/Application/Application'
import { FunctionComponent, MouseEventHandler, useCallback } from 'react'
import Switch from '@/Components/Switch/Switch'
import { isMobileScreen } from '@/Utils'

type Props = {
  application: WebApplication
  onToggle: (value: boolean) => void
  onClose: () => void
  isEnabled: boolean
}

const FocusModeSwitch: FunctionComponent<Props> = ({ application, onToggle, onClose, isEnabled }) => {
  const toggle: MouseEventHandler = useCallback(
    (e) => {
      e.preventDefault()

      onToggle(!isEnabled)
      onClose()
    },
    [onToggle, isEnabled, onClose],
  )

  const isMobile = application.isNativeMobileWeb() || isMobileScreen()

  if (isMobile) {
    return null
  }

  return (
    <button
      className="group flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none disabled:bg-default disabled:text-passive-2"
      onClick={toggle}
    >
      <div className="flex items-center">Focused Writing</div>
      <Switch className="px-0" checked={isEnabled} />
    </button>
  )
}

export default FocusModeSwitch
