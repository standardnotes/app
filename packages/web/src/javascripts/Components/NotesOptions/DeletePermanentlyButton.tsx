import Icon from '@/Components/Icon/Icon'
import MenuItem from '../Menu/MenuItem'

type DeletePermanentlyButtonProps = {
  onClick: () => void
}

export const DeletePermanentlyButton = ({ onClick }: DeletePermanentlyButtonProps) => (
  <MenuItem onClick={onClick}>
    <Icon type="close" className="mr-2 text-danger" />
    <span className="text-danger">Delete permanently</span>
  </MenuItem>
)
