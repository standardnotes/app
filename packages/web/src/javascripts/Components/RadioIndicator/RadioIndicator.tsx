type Props = {
  checked: boolean
  className?: string
}

const RadioIndicator = ({ checked, className }: Props) => (
  <div
    className={`w-4 h-4 border-2 border-solid rounded-full relative ${
      checked
        ? 'border-info after:bg-info after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-2 after:h-2 after:rounded-full'
        : 'border-passive-1'
    } ${className}`}
  ></div>
)

export default RadioIndicator
