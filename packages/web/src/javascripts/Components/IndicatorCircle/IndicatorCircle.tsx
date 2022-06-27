type Props = {
  style: 'neutral' | 'info' | 'danger'
}

const baseClassNames = 'border border-solid w-3 h-3 p-0 rounded-full flex-shrink-0'

const IndicatorCircle = ({ style }: Props) => {
  switch (style) {
    case 'neutral':
      return <div className={`${baseClassNames} bg-neutral border-neutral`} />
    case 'info':
      return <div className={`${baseClassNames} bg-info border-info`} />
    case 'danger':
      return <div className={`${baseClassNames} bg-danger border-danger`} />
  }
}

export default IndicatorCircle
