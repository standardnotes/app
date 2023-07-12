import { classNames } from '@standardnotes/utils'
import Icon from '../Icon/Icon'
import { ComponentPropsWithoutRef } from 'react'

const CheckIndicator = ({ checked, className, ...props }: { checked: boolean } & ComponentPropsWithoutRef<'div'>) => (
  <div
    className={classNames(
      'relative h-5 w-5 rounded border-2 md:h-4 md:w-4',
      checked ? 'border-info bg-info' : 'border-passive-1',
      className,
    )}
    role="presentation"
    {...props}
  >
    {checked && (
      <Icon
        type="check"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-info-contrast"
        size="small"
      />
    )}
  </div>
)

export default CheckIndicator
