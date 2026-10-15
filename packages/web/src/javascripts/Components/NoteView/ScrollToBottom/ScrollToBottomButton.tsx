import Icon from '@/Components/Icon/Icon'
import { c } from 'ttag'

type Props = {
  onClick: () => void
}

export function ScrollToBottomButton({ onClick }: Props) {
  const label = c('B4.Notes.EditingUI.Action').t`Scroll to bottom`

  return (
    <button
      type="button"
      className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-contrast shadow-md hover:bg-passive-4"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon type="arrow-down" size="small" />
    </button>
  )
}
