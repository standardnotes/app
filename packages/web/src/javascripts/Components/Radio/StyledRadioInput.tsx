import { classNames } from '@standardnotes/utils'
import { ComponentPropsWithoutRef } from 'react'
import RadioIndicator from './RadioIndicator'

type Props = ComponentPropsWithoutRef<'input'>

const StyledRadioInput = ({ className, ...props }: Props) => {
  return (
    <div className={classNames('flex', className)}>
      <input type="radio" className="h-0 w-0 opacity-0" {...props} />
      <RadioIndicator checked={!!props.checked} />
    </div>
  )
}

export default StyledRadioInput
