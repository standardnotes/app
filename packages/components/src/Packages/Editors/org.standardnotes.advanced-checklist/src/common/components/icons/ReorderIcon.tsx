type ReorderIconProps = {
  highlight?: boolean
}

export const ReorderIcon: React.FC<ReorderIconProps> = ({ highlight = false }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`sn-icon block ${highlight ? 'info' : 'neutral'}`}
      data-testid="reorder-icon"
    >
      <path d="M3 15H21V13H3V15ZM3 19H21V17H3V19ZM3 11H21V9H3V11ZM3 5V7H21V5H3Z" />
    </svg>
  )
}
