import { classNames } from '@standardnotes/utils'
import { ComponentPropsWithoutRef } from 'react'
import Icon from '../Icon/Icon'

type Props = ComponentPropsWithoutRef<'button'>

const ClearInputButton = ({ className, ...props }: Props) => {
  return (
    <button className={classNames('flex cursor-pointer border-0 bg-transparent p-0', className)} {...props}>
      <Icon type="clear-circle-filled" className="text-neutral" />
    </button>
  )
}

export default ClearInputButton
