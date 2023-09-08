import { TrustedContactInterface } from '@standardnotes/models'
import Icon from '../Icon/Icon'

const LastEditedByBadge = ({ contact }: { contact: TrustedContactInterface }) => {
  return (
    <div
      title="Last edited by"
      className="flex select-none items-center rounded bg-info px-1.5 py-1 text-info-contrast"
    >
      <Icon ariaLabel="Shared by" type="pencil" className="mr-1 text-info-contrast" size="medium" />
      <span className="mr-auto overflow-hidden text-ellipsis text-sm font-semibold lg:text-xs">{contact.name}</span>
    </div>
  )
}

export default LastEditedByBadge
