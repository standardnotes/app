import { jtString } from '@standardnotes/features'
import { c } from 'ttag'
import Button from '@/Components/Button/Button'
import MobileItemsListButton from '../NoteGroupView/MobileItemsListButton'

function translatedProtectedItemType(itemType: 'note' | 'file'): string {
  return itemType === 'note'
    ? c('B3.Notes.NoteActions.Label').t`note`
    : c('B7.FilesSubscriptionHelp.Files.Label').t`file`
}

type Props = {
  showAccountMenu: () => void
  onViewItem: () => void
  hasProtectionSources: boolean
  itemType: 'note' | 'file'
}

const ProtectedItemOverlay = ({ showAccountMenu, onViewItem, hasProtectionSources, itemType }: Props) => {
  const itemTypeLabel = translatedProtectedItemType(itemType)

  const instructionText = hasProtectionSources
    ? jtString(c('B2.NavSharedUI.Info').jt`Authenticate to view this ${itemTypeLabel}.`)
    : jtString(
        c('B2.NavSharedUI.Info')
          .jt`Add a passcode or create an account to require authentication to view this ${itemTypeLabel}.`,
      )

  return (
    <div aria-label={c('B2.NavSharedUI.Label').t`Protected overlay`} className="section editor sn-component p-5">
      <div className="flex h-full flex-grow flex-col justify-center md:flex-row md:items-center">
        <div className="mb-auto p-4 md:hidden">
          <MobileItemsListButton />
        </div>
        <div className="mb-auto flex max-w-md flex-col items-center justify-center text-center md:mb-0">
          <h1 className="m-0 w-full text-2xl font-bold">
            {jtString(c('B2.NavSharedUI.Title').jt`This ${itemTypeLabel} is protected`)}
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
                : jtString(c('B2.NavSharedUI.Action').jt`View ${itemTypeLabel}`)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProtectedItemOverlay
