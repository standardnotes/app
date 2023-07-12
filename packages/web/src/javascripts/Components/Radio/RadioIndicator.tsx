type Props = {
  checked: boolean
  className?: string
  disabled?: boolean
}

const RadioIndicator = ({ checked, className, disabled }: Props) => (
  <div
    className={`relative h-5 w-5 rounded-full border-2 border-solid md:h-4 md:w-4 ${disabled ? 'opacity-50' : ''} ${
      checked
        ? 'border-info after:absolute after:left-1/2 after:top-1/2 after:h-3 after:w-3 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-info md:after:h-2 md:after:w-2'
        : 'border-passive-1'
    } ${className}`}
  ></div>
)

export default RadioIndicator
