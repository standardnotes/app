import { classNames } from '@standardnotes/utils'
import { ComponentPropsWithoutRef } from 'react'
import RadioIndicator from './RadioIndicator'

type Props = ComponentPropsWithoutRef<'input'>

const StyledRadioInput = (props: Props) => {
  return (
    <div className="flex">
      <input type="radio" className={classNames('h-0 w-0 opacity-0', props.className)} {...props} />
      <RadioIndicator checked={!!props.checked} />
    </div>
  )
}

export default StyledRadioInput
