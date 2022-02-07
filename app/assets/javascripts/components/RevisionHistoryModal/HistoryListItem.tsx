import { FunctionComponent } from 'preact';

type HistoryListItemProps = {
  isSelected: boolean;
  label: string;
  onClick: () => void;
};

export const HistoryListItem: FunctionComponent<HistoryListItemProps> = ({
  isSelected,
  label,
  onClick,
}) => {
  return (
    <button
      className={`sn-dropdown-item py-2.5 focus:bg-info-backdrop focus:shadow-none ${
        isSelected ? 'bg-info-backdrop' : ''
      }`}
      onClick={onClick}
    >
      <div
        className={`pseudo-radio-btn ${
          isSelected ? 'pseudo-radio-btn--checked' : ''
        } mr-2`}
      ></div>
      {label}
    </button>
  );
};
