import { ViewControllerManager } from '@/Services/ViewControllerManager'
import Button from '@/Components/Button/Button'

type Props = {
  viewControllerManager: ViewControllerManager
  onViewItem: () => void
  hasProtectionSources: boolean
  itemType: 'note' | 'file'
}

const ProtectedItemOverlay = ({ viewControllerManager, onViewItem, hasProtectionSources, itemType }: Props) => {
  const instructionText = hasProtectionSources
    ? `Authenticate to view this ${itemType}.`
    : `Add a passcode or create an account to require authentication to view this ${itemType}.`

  return (
    <div className="flex max-w-md flex-col items-center justify-center text-center">
      <h1 className="m-0 w-full text-2xl font-bold">This {itemType} is protected</h1>
      <p className="mt-2 w-full text-lg">{instructionText}</p>
      <div className="mt-4 flex gap-3">
        {!hasProtectionSources && (
          <Button
            primary
            small
            onClick={() => {
              viewControllerManager.accountMenuController.setShow(true)
            }}
          >
            Open account menu
          </Button>
        )}
        <Button small onClick={onViewItem}>
          {hasProtectionSources ? 'Authenticate' : `View ${itemType}`}
        </Button>
      </div>
    </div>
  )
}

export default ProtectedItemOverlay
