import { TrustedContactInterface } from '@standardnotes/models'
import { c } from 'ttag'
import Icon from '../Icon/Icon'

const LastEditedByBadge = ({ contact }: { contact: TrustedContactInterface }) => {
  return (
    <div
      title={c('B2.NavSharedUI.Label').t`Last edited by`}
      className="flex select-none items-center rounded bg-info px-1.5 py-1 text-info-contrast"
    >
      <Icon
        ariaLabel={c('B2.NavSharedUI.Label').t`Shared by`}
        type="pencil"
        className="mr-1 text-info-contrast"
        size="medium"
      />
      <span className="mr-auto overflow-hidden text-ellipsis text-sm font-semibold lg:text-xs">{contact.name}</span>
    </div>
  )
}

export default LastEditedByBadge
