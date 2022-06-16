import { ViewControllerManager } from '@/Services/ViewControllerManager'

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
    <div className="flex flex-col items-center justify-center text-center max-w-md">
      <h1 className="text-2xl m-0 w-full">This {itemType} is protected</h1>
      <p className="text-lg mt-2 w-full">{instructionText}</p>
      <div className="mt-4 flex gap-3">
        {!hasProtectionSources && (
          <button
            className="sn-button small info"
            onClick={() => {
              viewControllerManager.accountMenuController.setShow(true)
            }}
          >
            Open account menu
          </button>
        )}
        <button className="sn-button small outlined normal-focus-brightness" onClick={onViewItem}>
          {hasProtectionSources ? 'Authenticate' : `View ${itemType}`}
        </button>
      </div>
    </div>
  )
}

export default ProtectedItemOverlay
