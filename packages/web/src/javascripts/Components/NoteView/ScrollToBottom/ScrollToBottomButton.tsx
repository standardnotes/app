import Icon from '@/Components/Icon/Icon'
import { classNames } from '@standardnotes/utils'
import { c } from 'ttag'

type Props = {
  onClick: () => void
  className?: string
}

export function ScrollToBottomButton({ onClick, className }: Props) {
  return (
    <button
      type="button"
      className={classNames(
        'absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-contrast shadow-md hover:bg-passive-4',
        className,
      )}
      aria-label={c('B4.Notes.EditingUI.Action').t`Scroll to bottom`}
      onClick={onClick}
    >
      <Icon type="arrow-down" size="small" />
    </button>
  )
}
