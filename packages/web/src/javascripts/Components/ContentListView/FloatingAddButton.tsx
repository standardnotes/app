import { classNames } from '@standardnotes/snjs'
import { ButtonStyle, getColorsForPrimaryVariant } from '../Button/Button'
import Icon from '../Icon/Icon'
import { useAvailableSafeAreaPadding } from '@/Hooks/useSafeAreaPadding'

type Props = {
  label: string
  style: ButtonStyle
  onClick?: () => void
}

const PropertiesRequiredForFixedPositioningToWorkOnIOSSafari: React.CSSProperties = {
  transform: 'translate3d(0, 0, 0)',
}

const FloatingAddButton = ({ label, style, onClick }: Props) => {
  const buttonClasses = getColorsForPrimaryVariant(style)
  const { hasBottomInset } = useAvailableSafeAreaPadding()

  return (
    <button
      className={classNames(
        'fixed right-6 z-editor-title-bar ml-3 flex h-15 w-15 cursor-pointer items-center',
        `justify-center rounded-full border border-solid border-transparent ${buttonClasses}`,
        'hover:brightness-125',
        hasBottomInset ? 'bottom-[calc(var(--safe-area-inset-bottom)+0.5rem)]' : 'bottom-6',
      )}
      title={label}
      aria-label={label}
      onClick={onClick}
      style={PropertiesRequiredForFixedPositioningToWorkOnIOSSafari}
    >
      <Icon type="add" size="custom" className="h-8 w-8" />
    </button>
  )
}

export default FloatingAddButton
