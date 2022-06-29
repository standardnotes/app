type ReorderIconProps = {
  highlight?: boolean
}

export const ReorderIcon: React.FC<ReorderIconProps> = ({ highlight = false }) => {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`sn-icon block ${highlight ? 'info' : 'neutral'}`}
      data-testid="reorder-icon"
    >
      <path d="M17 5V6.66667H3V5H17ZM3 15H17V13.3333H3V15ZM3 10.8333H17V9.16667H3V10.8333Z" />
    </svg>
  )
}
