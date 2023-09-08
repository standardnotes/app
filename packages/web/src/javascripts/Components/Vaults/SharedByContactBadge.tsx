import { TrustedContactInterface } from '@standardnotes/models'
import Icon from '../Icon/Icon'

const SharedByContactBadge = ({ contact }: { contact: TrustedContactInterface }) => {
  return (
    <div title="Shared by contact" className="flex items-center rounded bg-info px-1.5 py-1 text-neutral-contrast">
      <Icon ariaLabel="Shared by contact" type="archive" className="mr-1 text-info-contrast" size="medium" />
      <div className="text-center text-sm font-semibold lg:text-xs">{contact.name}</div>
    </div>
  )
}

export default SharedByContactBadge
