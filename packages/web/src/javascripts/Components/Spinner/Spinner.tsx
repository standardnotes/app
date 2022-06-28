type Props = {
  className?: string
}

const Spinner = ({ className }: Props) => (
  <div className={`animate-spin rounded-full border border-solid border-info border-r-transparent ${className}`} />
)

export default Spinner
