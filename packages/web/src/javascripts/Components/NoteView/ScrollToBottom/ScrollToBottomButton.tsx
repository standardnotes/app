import Icon from '@/Components/Icon/Icon'
import { useAvailableSafeAreaPadding } from '@/Hooks/useSafeAreaPadding'
import { classNames } from '@standardnotes/snjs'
import { c } from 'ttag'

type Props = {
  /** Space the button has to clear, e.g. a toolbar at the bottom of a component editor */
  bottomInset: number
  onClick: () => void
}

export function ScrollToBottomButton({ bottomInset, onClick }: Props) {
  const { hasBottomInset } = useAvailableSafeAreaPadding()
  const label = c('B4.Notes.EditingUI.Action').t`Scroll to bottom`

  return (
    <button
      type="button"
      className={classNames(
        'absolute right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-contrast shadow-md hover:bg-passive-4',
        // Absolute children ignore the container's safe area padding
        hasBottomInset ? 'bottom-[calc(var(--safe-area-inset-bottom)+1rem)]' : 'bottom-4',
      )}
      style={{ marginBottom: bottomInset }}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon type="arrow-down" size="small" />
    </button>
  )
}
