import Icon from '@/Components/Icon/Icon'
import { classNames } from '@standardnotes/utils'

type DeletePermanentlyButtonProps = {
  onClick: () => void
}

export const DeletePermanentlyButton = ({ onClick }: DeletePermanentlyButtonProps) => (
  <button
    className={classNames(
      'flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-mobile-menu-item',
      'text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-menu-item',
    )}
    onClick={onClick}
  >
    <Icon type="close" className="mr-2 text-danger" />
    <span className="text-danger">Delete permanently</span>
  </button>
)
