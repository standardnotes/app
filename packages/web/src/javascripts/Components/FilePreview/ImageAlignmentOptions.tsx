import { classNames, IconType } from '@standardnotes/snjs'
import IconButton from '@/Components/Button/IconButton'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'
import { ElementFormatType } from 'lexical'

export function getCSSValueFromAlignment(format: ElementFormatType) {
  switch (format) {
    case 'start':
    case 'left':
      return 'start'
    case 'right':
    case 'end':
      return 'end'
    default:
      return 'center'
  }
}

const Options = [
  {
    alignment: 'left',
    label: 'Left align',
  },
  {
    alignment: 'center',
    label: 'Center align',
  },
  {
    alignment: 'right',
    label: 'Right align',
  },
]

export function ImageAlignmentOptions({
  alignment: currentAlignment,
  changeAlignment,
}: {
  alignment: ElementFormatType
  changeAlignment: (format: ElementFormatType) => void
}) {
  return Options.map(({ alignment, label }) => (
    <StyledTooltip label={label} key={alignment}>
      <IconButton
        className={classNames(
          alignment === currentAlignment && '!bg-info text-info-contrast',
          'rounded p-1 hover:bg-contrast',
        )}
        icon={`format-align-${alignment}` as IconType}
        title={label}
        focusable={true}
        onClick={(e) => {
          // the preventDefault and stopPropagation for these events are required
          // so that the keyboard doesn't jump when you select another option
          e.preventDefault()
          e.stopPropagation()
          changeAlignment(alignment as ElementFormatType)
        }}
        onMouseDown={(e) => {
          e.preventDefault()
        }}
      />
    </StyledTooltip>
  ))
}
