import { classNames } from '@standardnotes/snjs'
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

export function ImageAlignmentOptions({
  alignment,
  changeAlignment,
}: {
  alignment: ElementFormatType
  changeAlignment: (format: ElementFormatType) => void
}) {
  return (
    <>
      <StyledTooltip label="Left align">
        <IconButton
          className={classNames(alignment === 'left' && '!bg-info', 'rounded p-1 hover:bg-contrast')}
          icon="format-align-left"
          title="Left align"
          focusable={true}
          onClick={() => changeAlignment('left')}
        />
      </StyledTooltip>
      <StyledTooltip label="Center align">
        <IconButton
          className={classNames(alignment === 'center' && '!bg-info', 'rounded p-1 hover:bg-contrast')}
          icon="format-align-center"
          title="Center align"
          focusable={true}
          onClick={() => changeAlignment('center')}
        />
      </StyledTooltip>
      <StyledTooltip label="Right align">
        <IconButton
          className={classNames(alignment === 'right' && '!bg-info', 'rounded p-1 hover:bg-contrast')}
          icon="format-align-right"
          title="Right align"
          focusable={true}
          onClick={() => changeAlignment('right')}
        />
      </StyledTooltip>
    </>
  )
}
