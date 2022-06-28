type RoundButtonProps = {
  testId?: string
  onClick: () => void
  size?: 'normal' | 'small'
}

export const RoundButton: React.FC<RoundButtonProps> = ({ testId, onClick, children, size = 'normal' }) => {
  return (
    <button data-testid={testId} className={`sn-icon-button ${size}`} onClick={onClick}>
      {children}
    </button>
  )
}
