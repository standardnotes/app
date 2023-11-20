import { classNames } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'

type Props = {
  label: string
  selected: boolean
  onSelect: () => void
}

const styles = {
  base: 'active:border-info active:bg-info active:text-neutral-contrast flex-grow cursor-pointer rounded-full border border-solid px-2 py-1 text-center transition text-sm',
  unselected: 'text-neutral border-secondary-border bg-default',
  selected: 'text-neutral-contrast border-info bg-info',
}

const Bubble: FunctionComponent<Props> = ({ label, selected, onSelect }) => (
  <button
    role="checkbox"
    aria-checked={selected}
    className={classNames(styles.base, selected ? styles.selected : styles.unselected)}
    onClick={onSelect}
  >
    {label}
  </button>
)

export default Bubble
