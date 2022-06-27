import { Dispatch, FunctionComponent, Ref, SetStateAction, forwardRef, useState } from 'react'
import DecoratedInput from './DecoratedInput'
import IconButton from '@/Components/Button/IconButton'
import { DecoratedInputProps } from './DecoratedInputProps'

const Toggle: FunctionComponent<{
  isToggled: boolean
  setIsToggled: Dispatch<SetStateAction<boolean>>
}> = ({ isToggled, setIsToggled }) => (
  <IconButton
    className="w-5 h-5 p-0 justify-center rounded-full hover:bg-passive-4 text-neutral"
    icon={isToggled ? 'eye-off' : 'eye'}
    iconClassName="w-3.5 h-3.5"
    title="Show/hide password"
    onClick={() => setIsToggled((isToggled) => !isToggled)}
    focusable={true}
  />
)

/**
 * Password input that has a toggle to show/hide password and can be decorated on the left and right side
 */
const DecoratedPasswordInput = forwardRef((props: DecoratedInputProps, ref: Ref<HTMLInputElement>) => {
  const [isToggled, setIsToggled] = useState(false)

  const rightSideDecorations = props.right ? [...props.right] : []

  return (
    <DecoratedInput
      {...props}
      ref={ref}
      type={isToggled ? 'text' : 'password'}
      right={[...rightSideDecorations, <Toggle isToggled={isToggled} setIsToggled={setIsToggled} />]}
    />
  )
})

export default DecoratedPasswordInput
