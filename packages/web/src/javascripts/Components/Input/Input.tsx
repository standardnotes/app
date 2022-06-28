import { FunctionComponent } from 'react'

interface Props {
  text?: string
  disabled?: boolean
  className?: string
}

const Input: FunctionComponent<Props> = ({ className = '', disabled = false, text }) => {
  const base = 'rounded py-1.5 px-3 text-input my-1 h-8 bg-contrast'
  const stateClasses = disabled ? 'no-border' : 'border-solid border border-border'
  const classes = `${base} ${stateClasses} ${className}`
  return <input type="text" className={classes} disabled={disabled} value={text} />
}

export default Input
