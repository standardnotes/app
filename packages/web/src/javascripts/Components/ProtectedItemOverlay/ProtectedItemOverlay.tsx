import { c } from 'ttag'
import Button from '@/Components/Button/Button'
import MobileItemsListButton from '../NoteGroupView/MobileItemsListButton'

const jtString = (value: unknown): string => (Array.isArray(value) ? value.join('') : String(value))

type Props = {
  showAccountMenu: () => void
  onViewItem: () => void
  hasProtectionSources: boolean
  itemType: 'note' | 'file'
}

const ProtectedItemOverlay = ({ showAccountMenu, onViewItem, hasProtectionSources, itemType }: Props) => {
  const instructionText = hasProtectionSources
    ? jtString(c('B2.NavSharedUI.Info').jt`Authenticate to view this ${itemType}.`)
    : jtString(
        c('B2.NavSharedUI.Info')
          .jt`Add a passcode or create an account to require authentication to view this ${itemType}.`,
      )

  return (
    <div aria-label={c('B2.NavSharedUI.Label').t`Protected overlay`} className="section editor sn-component p-5">
      <div className="flex h-full flex-grow flex-col justify-center md:flex-row md:items-center">
        <div className="mb-auto p-4 md:hidden">
          <MobileItemsListButton />
        </div>
        <div className="mb-auto flex max-w-md flex-col items-center justify-center text-center md:mb-0">
          <h1 className="m-0 w-full text-2xl font-bold">
            {jtString(c('B2.NavSharedUI.Title').jt`This ${itemType} is protected`)}
          </h1>
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
                {c('B2.NavSharedUI.Action').t`Open account menu`}
              </Button>
            )}
            <Button small onClick={onViewItem}>
              {hasProtectionSources
                ? c('B2.NavSharedUI.Action').t`Authenticate`
                : jtString(c('B2.NavSharedUI.Action').jt`View ${itemType}`)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProtectedItemOverlay
