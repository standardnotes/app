interface BubbleProperties {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

const styles = {
  base: 'px-2 py-1 rounded-full cursor-pointer transition border-1 border-solid border-secondary text-neutral active:border-info active:bg-info active:color-neutral-contrast',
  selected: 'border-info bg-info color-neutral-contrast',
};

const Bubble = ({ label, selected, onSelect }: BubbleProperties) => (
  <span
    role="tab"
    className={`bubble ${styles.base} ${selected && styles.selected}`}
    onClick={onSelect}
  >
    {label}
  </span>
);

export default Bubble;
