import { FunctionComponent } from 'react'
import Icon from '../Icon/Icon'

type Props = {
  onMouseLeave: () => void
  onMouseOver: () => void
  onClick: () => void
  showLockedIcon: boolean
  lockText: string
}

const EditingDisabledBanner: FunctionComponent<Props> = ({
  onMouseLeave,
  onMouseOver,
  onClick,
  showLockedIcon,
  lockText,
}) => {
  const background = showLockedIcon ? 'bg-warning-faded' : 'bg-info-faded'
  const iconColor = showLockedIcon ? 'text-accessory-tint-3' : 'text-accessory-tint-1'
  const textColor = showLockedIcon ? 'text-warning' : 'text-accessory-tint-1'

  return (
    <div
      className={`flex items-center relative ${background} px-3.5 py-2 cursor-pointer`}
      onMouseLeave={onMouseLeave}
      onMouseOver={onMouseOver}
      onClick={onClick}
    >
      {showLockedIcon ? (
        <Icon type="pencil-off" className={`${iconColor} flex fill-current mr-3`} />
      ) : (
        <Icon type="pencil" className={`${iconColor} flex fill-current mr-3`} />
      )}
      <span className={textColor}>{lockText}</span>
    </div>
  )
}

export default EditingDisabledBanner
