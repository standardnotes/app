import Button from '@/Components/Button/Button'
import MobileItemsListButton from '../NoteGroupView/MobileItemsListButton'

type Props = {
  showAccountMenu: () => void
  onViewItem: () => void
  hasProtectionSources: boolean
  itemType: 'note' | 'file'
}

const ProtectedItemOverlay = ({ showAccountMenu, onViewItem, hasProtectionSources, itemType }: Props) => {
  const instructionText = hasProtectionSources
    ? `Authenticate to view this ${itemType}.`
    : `Add a passcode or create an account to require authentication to view this ${itemType}.`

  return (
    <div aria-label="Protected overlay" className="section editor sn-component p-5">
      <div className="flex h-full flex-grow flex-col justify-center md:flex-row md:items-center">
        <div className="mb-auto p-4 md:hidden">
          <MobileItemsListButton />
        </div>
        <div className="mb-auto flex max-w-md flex-col items-center justify-center text-center md:mb-0">
          <h1 className="m-0 w-full text-2xl font-bold">This {itemType} is protected</h1>
          <p className="mt-2 w-full text-lg">{instructionText}</p>
          <div className="mt-4 flex gap-3">
            {!hasProtectionSources && (
              <Button
                primary
                small
                onClick={() => {
                  showAccountMenu()
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
      </div>
    </div>
  )
}

export default ProtectedItemOverlay
