interface BubbleProperties {
    label: string,
    selected: boolean,
    onSelect: () => void
}

const Bubble = ({ label, selected, onSelect }: BubbleProperties) => (
    <span role="tab"
        className={`bubble ${selected && 'selected'}`}
        onClick={onSelect}
    >
        {label}
    </span>
);

export default Bubble;
