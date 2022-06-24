import { FunctionComponent } from 'react'

type Props = {
  label: string
  selected: boolean
  onSelect: () => void
}

const styles = {
  base: 'px-2 py-1.5 text-center rounded-full cursor-pointer transition border border-solid active:border-info active:bg-info active:text-neutral-contrast',
  unselected: 'text-neutral border-secondary-border',
  selected: 'border-info bg-info text-neutral-contrast',
}

const Bubble: FunctionComponent<Props> = ({ label, selected, onSelect }) => (
  <span
    role="tab"
    className={`bubble ${styles.base} ${selected ? styles.selected : styles.unselected}`}
    onClick={onSelect}
  >
    {label}
  </span>
)

export default Bubble
