type Props = {
  style: 'neutral' | 'info' | 'danger'
}

const baseClassNames = 'border border-solid w-3 h-3 p-0 rounded-full flex-shrink-0'

const IndicatorCircle = ({ style }: Props) => {
  switch (style) {
    case 'neutral':
      return <div className={`${baseClassNames} border-neutral bg-neutral`} />
    case 'info':
      return <div className={`${baseClassNames} border-info bg-info`} />
    case 'danger':
      return <div className={`${baseClassNames} border-danger bg-danger`} />
  }
}

export default IndicatorCircle
