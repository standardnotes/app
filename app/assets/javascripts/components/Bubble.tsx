interface BubbleProperties {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

const styles = {
  base: 'px-2 py-1.5 text-center rounded-full cursor-pointer transition border-1 border-solid active:border-info active:bg-info active:color-neutral-contrast',
  unselected: 'color-neutral border-secondary',
  selected: 'border-info bg-info color-neutral-contrast',
};

const Bubble = ({ label, selected, onSelect }: BubbleProperties) => (
  <span
    role="tab"
    className={`bubble ${styles.base} ${
      selected ? styles.selected : styles.unselected
    }`}
    onClick={onSelect}
  >
    {label}
  </span>
);

export default Bubble;
