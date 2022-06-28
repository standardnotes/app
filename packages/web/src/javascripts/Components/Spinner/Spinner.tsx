type Props = {
  className?: string
}

const Spinner = ({ className }: Props) => (
  <div className={`animate-spin border border-solid border-info border-r-transparent rounded-full ${className}`} />
)

export default Spinner
