import { ReactNode } from 'react'

type ClearFilterButtonProps = {
  onClick: () => void
  children: ReactNode
}

export const ClearFilterButton = ({ onClick, children }: ClearFilterButtonProps) => (
  <button
    type="button"
    className="mb-2 cursor-pointer border-0 bg-transparent p-0 text-xs text-info hover:underline"
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
  >
    {children}
  </button>
)

type SearchOptionsSectionProps = {
  label: string
  children: ReactNode
  action?: ReactNode
}

const SearchOptionsSection = ({ label, children, action }: SearchOptionsSectionProps) => (
  <div>
    <div className="mb-1 flex items-center justify-between gap-2">
      <div className="text-xs text-passive-0">{label}</div>
      {action}
    </div>
    {children}
  </div>
)

export default SearchOptionsSection
