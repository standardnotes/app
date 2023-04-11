import { FunctionComponent, useState } from 'react'
import Icon from '../Icon/Icon'

type Props = {
  onClick: () => void
  noteLocked: boolean
}

const EditingDisabledBanner: FunctionComponent<Props> = ({ onClick, noteLocked }) => {
  const [showDisabledCopy, setShowDisabledCopy] = useState(() => noteLocked)

  const background = showDisabledCopy ? 'bg-warning-faded' : 'bg-info-faded'
  const iconColor = showDisabledCopy ? 'text-accessory-tint-3' : 'text-accessory-tint-1'
  const textColor = showDisabledCopy ? 'text-warning' : 'text-accessory-tint-1'

  const text = showDisabledCopy ? 'Note editing disabled.' : 'Enable editing'

  return (
    <div
      className={`relative flex items-center ${background} cursor-pointer px-3.5 py-2 text-sm`}
      onMouseLeave={() => {
        setShowDisabledCopy(true)
      }}
      onMouseOver={() => {
        setShowDisabledCopy(false)
      }}
      onClick={onClick}
    >
      {showDisabledCopy ? (
        <Icon type="pencil-off" className={`${iconColor} mr-3 flex fill-current`} />
      ) : (
        <Icon type="pencil" className={`${iconColor} mr-3 flex fill-current`} />
      )}
      <span className={textColor}>{text}</span>
    </div>
  )
}

export default EditingDisabledBanner
