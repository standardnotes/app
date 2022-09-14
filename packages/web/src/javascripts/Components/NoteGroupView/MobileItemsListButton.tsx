import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import Icon from '../Icon/Icon'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

const MobileItemsListButton = () => {
  const { toggleAppPane } = useResponsiveAppPane()

  return (
    <button
      className="bg-text-padding mr-3 flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast md:hidden"
      onClick={() => {
        toggleAppPane(AppPaneId.Items)
      }}
      title="Go to items list"
      aria-label="Go to items list"
    >
      <Icon type="chevron-left" />
    </button>
  )
}

export default MobileItemsListButton
