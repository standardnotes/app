import { TrustedContactInterface } from '@standardnotes/models'
import Icon from '../Icon/Icon'

const SharedByContactBadge = ({ contact }: { contact: TrustedContactInterface }) => {
  return (
    <div title="Shared by contact" className="rounded bg-info px-1.5 py-1 text-neutral-contrast">
      <span className="flex items-center" title="Shared by contact">
        <Icon ariaLabel="Shared by contact" type="archive" className="mr-1 text-info-contrast" size="medium" />
        <div className="text-center text-xs font-bold">{contact.name}</div>
      </span>
    </div>
  )
}

export default SharedByContactBadge
